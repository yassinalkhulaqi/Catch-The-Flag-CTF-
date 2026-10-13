<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\User;
use App\Services\ChallengeFileService;
use Database\Factories\ChallengeFlagFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

/**
 * Phase 6 security matrix (docs/security.md §11).
 *
 * Covers ONLY gaps left by AdminTest / SubmissionTest / AuthTest /
 * ContentTest / FileDownloadTest / QuizTest / NotificationTest:
 * no duplicated assertions (register role, update-status, moderator
 * audit-logs, ../ download, flag store bodies are already covered).
 */
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function headersFor(User $user): array
    {
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function apiCall(string $method, string $uri, array $data = [], array $headers = []): TestResponse
    {
        $this->app['auth']->forgetGuards();

        return $this->json($method, $uri, $data, $headers);
    }

    // (a) Oversize upload: HTTP FormRequest rejects with 422; the service
    // itself throws 413 (defense in depth for direct calls). Both reject —
    // nothing oversized is ever persisted.
    public function test_oversize_upload_is_rejected(): void
    {
        Storage::fake('challenge-files');
        config(['ctf.uploads.max_file_mb' => 1]);

        $headers = $this->headersFor(User::factory()->admin()->create());
        $challenge = Challenge::factory()->create();
        $url = "/api/v1/admin/challenges/{$challenge->id}/files";

        $this->app['auth']->forgetGuards();
        $this->post($url, [
            'file' => UploadedFile::fake()->create('big.txt', 2048, 'text/plain'),
        ], $headers)
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed');

        $this->assertSame(0, ChallengeFile::count());

        try {
            app(ChallengeFileService::class)->store(
                $challenge,
                UploadedFile::fake()->create('big.txt', 2048, 'text/plain')
            );
            $this->fail('Oversize file should throw 413 at the service layer.');
        } catch (HttpException $e) {
            $this->assertSame(413, $e->getStatusCode());
        }

        $this->assertSame(0, ChallengeFile::count());
    }

    // (b) Traversal filename is neutralized: Symfony basenames the client
    // name, sanitizeName strips separators, and the storage key is a
    // server-generated UUID under challenges/{id}/ — never user input.
    public function test_traversal_filename_is_sanitized_and_key_is_uuid(): void
    {
        Storage::fake('challenge-files');

        $headers = $this->headersFor(User::factory()->admin()->create());
        $challenge = Challenge::factory()->create();
        $url = "/api/v1/admin/challenges/{$challenge->id}/files";

        $this->app['auth']->forgetGuards();
        $response = $this->post($url, [
            'file' => UploadedFile::fake()->create('../../evil.png', 10, 'text/plain'),
        ], $headers)->assertCreated();

        $original = (string) $response->json('data.original_name');
        $this->assertStringNotContainsString('/', $original);
        $this->assertStringNotContainsString('..', $original);
        $this->assertStringNotContainsString('\\', $original);

        $row = ChallengeFile::findOrFail($response->json('data.id'));
        $this->assertStringStartsWith("challenges/{$challenge->id}/", $row->storage_key);
        $this->assertStringNotContainsString('..', $row->storage_key);
        $this->assertMatchesRegularExpression(
            '#^challenges/\d+/[0-9a-fA-F-]+\.[a-z0-9]{1,12}$#',
            $row->storage_key
        );
        $this->assertTrue(Storage::disk('challenge-files')->exists($row->storage_key));

        $this->assertStringNotContainsString('storage_key', $response->getContent() ?: '');
    }

    // (c) MIME spoof: PHP code served with a client image/png mime and .png
    // name is rejected by server-side finfo detection (text/x-php not in
    // the allowlist). A REAL UploadedFile is required here — fake() files
    // report mime by extension and would not exercise finfo.
    public function test_mime_spoof_is_rejected_by_server_side_detection(): void
    {
        Storage::fake('challenge-files');

        $headers = $this->headersFor(User::factory()->admin()->create());
        $challenge = Challenge::factory()->create();

        $tmp = tempnam(sys_get_temp_dir(), 'ctf-spoof');
        $this->assertNotFalse($tmp);
        file_put_contents($tmp, '<?php echo "pwn"; system($_GET["c"]); ?>');

        try {
            $upload = new UploadedFile($tmp, 'evil.png', 'image/png', null, true);
            $this->assertSame('text/x-php', $upload->getMimeType());

            $this->app['auth']->forgetGuards();
            $this->post(
                "/api/v1/admin/challenges/{$challenge->id}/files",
                ['file' => $upload],
                $headers
            )->assertStatus(422)->assertJsonPath('error.code', 'bad_request');
        } finally {
            @unlink($tmp);
        }

        $this->assertSame(0, ChallengeFile::count());
    }

    // (d) Admin challenge show + flags index never leak flag material.
    // (Flag store/show/update bodies are already covered in AdminTest.)
    public function test_admin_show_and_flags_contain_no_flag_material(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $challenge = Challenge::factory()->create();
        $plaintext = 'CTF{phase6-no-leak-probe}';

        $this->apiCall('POST', "/api/v1/admin/challenges/{$challenge->id}/flags", [
            'flag' => $plaintext,
            'label' => 'main',
        ], $headers)->assertCreated();

        foreach ([
            $this->apiCall('GET', "/api/v1/admin/challenges/{$challenge->id}", [], $headers)->assertOk(),
            $this->apiCall('GET', "/api/v1/admin/challenges/{$challenge->id}/flags", [], $headers)->assertOk(),
        ] as $response) {
            $body = $response->getContent() ?: '';
            foreach (['flag_ciphertext', 'flag_hash', 'flag_plaintext', $plaintext] as $forbidden) {
                $this->assertStringNotContainsString($forbidden, $body);
            }
        }
    }

    // (e) Password-reset tokens expire after 60 minutes (config/auth.php).
    public function test_password_reset_token_expires_after_60_minutes(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'solver@example.com']);
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'solver@example.com'])
            ->assertAccepted();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });
        $this->assertNotNull($token);

        DB::table('password_reset_tokens')
            ->where('email', 'solver@example.com')
            ->update(['created_at' => now()->subMinutes(61)]);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'solver@example.com',
            'password' => 'brand-new-password-42',
            'password_confirmation' => 'brand-new-password-42',
        ])->assertBadRequest()->assertJsonPath('error.code', 'bad_request');

        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }

    // (f) IDOR by construction: /me/* has no user-id parameter, so A can
    // never read B's solves or ledger. (Notification + quiz-attempt IDOR
    // are already covered; moderator audit-logs 403 is covered in
    // AdminTest, so here we pin the uncovered admin-users-show-as-user.)
    public function test_me_endpoints_never_leak_another_users_data(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $headersA = $this->headersFor($userA);
        $headersB = $this->headersFor($userB);

        $challengeA = Challenge::factory()->create(['points' => 100]);
        $flagA = ChallengeFlagFactory::withPlaintext($challengeA);
        $challengeB = Challenge::factory()->create(['points' => 200]);
        $flagB = ChallengeFlagFactory::withPlaintext($challengeB);

        $this->app['auth']->forgetGuards();
        $this->postJson("/api/v1/challenges/{$challengeA->id}/submissions", ['flag' => $flagA['plaintext']], $headersA)->assertOk();
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/v1/challenges/{$challengeB->id}/submissions", ['flag' => $flagB['plaintext']], $headersB)->assertOk();

        $this->app['auth']->forgetGuards();
        $solves = $this->getJson('/api/v1/me/solves', $headersA)->assertOk()->json('data');
        $solvedIds = collect($solves)->pluck('challenge.id')->all();
        $this->assertContains($challengeA->id, $solvedIds);
        $this->assertNotContains($challengeB->id, $solvedIds);

        $this->app['auth']->forgetGuards();
        $ledger = $this->getJson('/api/v1/me/xp-ledger', $headersA)->assertOk()->json('data');
        $amounts = collect($ledger)->pluck('amount')->all();
        $this->assertContains(100, $amounts);
        $this->assertNotContains(200, $amounts);

        $this->apiCall('GET', "/api/v1/admin/users/{$userB->id}", [], $headersA)
            ->assertForbidden()
            ->assertJsonPath('error.code', 'forbidden');
    }

    // (g) URL-encoded traversal as the file id is a clean 404, never a 500.
    public function test_encoded_traversal_file_id_is_404(): void
    {
        Storage::fake('challenge-files');

        $user = User::factory()->create();
        $headers = $this->headersFor($user);
        $challenge = Challenge::factory()->create(['status' => 'published', 'published_at' => now()]);
        $file = ChallengeFile::factory()->for($challenge)->create([
            'storage_key' => "challenges/{$challenge->id}/probe.bin",
        ]);
        Storage::disk('challenge-files')->put($file->storage_key, 'probe-data');

        $this->app['auth']->forgetGuards();
        $this->get("/api/v1/challenges/{$challenge->id}/files/%2e%2e/download", $headers)
            ->assertNotFound();
    }

    // (h) Challenge CREATE ignores status (register-role is covered in
    // AuthTest; challenge UPDATE-status is covered in AdminTest).
    public function test_challenge_create_ignores_status_and_stays_draft(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $category = Category::factory()->create();

        $id = $this->apiCall('POST', '/api/v1/admin/challenges', [
            'title' => 'Status smuggling probe',
            'description' => 'Attempt to publish on create.',
            'category_id' => $category->id,
            'difficulty' => 'beginner',
            'points' => 100,
            'status' => 'published',
        ], $headers)->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');

        $this->assertSame('draft', Challenge::findOrFail($id)->status->value);
    }

    // API hardening headers ride on every /api/* response.
    public function test_api_responses_carry_security_headers(): void
    {
        $response = $this->getJson('/api/v1/challenges')->assertOk();

        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame('DENY', $response->headers->get('X-Frame-Options'));
        $this->assertSame('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
        $this->assertSame('camera=(), microphone=(), geolocation=()', $response->headers->get('Permissions-Policy'));
    }
}
