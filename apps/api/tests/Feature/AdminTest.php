<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function headersFor(User $user): array
    {
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    /**
     * Forget cached guard users so each call authenticates its own
     * bearer token (feature tests share one app instance per test).
     */
    private function apiCall(string $method, string $uri, array $data = [], array $headers = []): TestResponse
    {
        $this->app['auth']->forgetGuards();

        return $this->json($method, $uri, $data, $headers);
    }

    /** @return array{Challenge, array<string, string>} */
    private function challengePayload(array $overrides = []): array
    {
        $category = Category::factory()->create();

        return [array_merge([
            'title' => 'Forensic Memory Dump',
            'description' => 'Analyze the dump.',
            'scenario' => 'A workstation was compromised.',
            'category_id' => $category->id,
            'difficulty' => 'intermediate',
            'points' => 200,
            'estimated_minutes' => 45,
        ], $overrides)];
    }

    // --- role matrix ---

    public function test_guest_gets_401_on_admin_routes(): void
    {
        $this->getJson('/api/v1/admin/challenges')->assertUnauthorized();
    }

    public function test_regular_user_gets_403_on_admin_routes(): void
    {
        $headers = $this->headersFor(User::factory()->create());

        $this->apiCall('GET', '/api/v1/admin/challenges', [], $headers)
            ->assertForbidden()
            ->assertJsonPath('error.code', 'forbidden');
    }

    public function test_moderator_manages_content_but_not_users_or_audit(): void
    {
        $headers = $this->headersFor(User::factory()->moderator()->create());
        [$payload] = $this->challengePayload();

        $this->apiCall('GET', '/api/v1/admin/challenges', [], $headers)->assertOk();
        $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->assertCreated();

        $this->apiCall('GET', '/api/v1/admin/users', [], $headers)->assertForbidden();
        $this->apiCall('GET', '/api/v1/admin/audit-logs', [], $headers)->assertForbidden();

        $user = User::factory()->create();
        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/ban", ['reason' => 'x'], $headers)->assertForbidden();
        $this->apiCall('PUT', "/api/v1/admin/users/{$user->id}/role", ['role' => 'moderator'], $headers)->assertForbidden();
    }

    // --- challenges + transitions ---

    public function test_admin_creates_draft_challenge_and_publishes(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        [$payload] = $this->challengePayload();

        $created = $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.title', 'Forensic Memory Dump')
            ->json('data');

        $this->assertArrayNotHasKey('flag_ciphertext', $created);
        $this->assertArrayNotHasKey('flag_hash', $created);

        $this->apiCall('POST', "/api/v1/admin/challenges/{$created['id']}/publish", [], $headers)
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->assertNotNull(Challenge::find($created['id'])->published_at);
    }

    public function test_challenge_update_ignores_status_and_privileged_fields(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        [$payload] = $this->challengePayload();
        $id = $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->json('data.id');

        $this->apiCall('PUT', "/api/v1/admin/challenges/{$id}", [
            'title' => 'Renamed',
            'status' => 'published',
            'xp' => 9999,
            'role' => 'admin',
            'flag_ciphertext' => 'stolen',
        ], $headers)->assertOk()->assertJsonPath('data.title', 'Renamed');

        $fresh = Challenge::find($id);
        $this->assertSame('draft', $fresh->status->value);
        $this->assertSame('Renamed', $fresh->title);
    }

    public function test_illegal_transition_is_409(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        [$payload] = $this->challengePayload();
        $id = $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->json('data.id');

        $this->apiCall('POST', "/api/v1/admin/challenges/{$id}/archive", [], $headers)->assertOk();

        $this->apiCall('POST', "/api/v1/admin/challenges/{$id}/publish", [], $headers)
            ->assertConflict()
            ->assertJsonPath('error.code', 'conflict');
    }

    public function test_challenge_destroy_archives_instead_of_deleting(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        [$payload] = $this->challengePayload();
        $id = $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->json('data.id');

        $this->apiCall('DELETE', "/api/v1/admin/challenges/{$id}", [], $headers)
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');

        $this->assertSame('archived', Challenge::find($id)->status->value);
    }

    public function test_unpublish_returns_review_to_draft(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        [$payload] = $this->challengePayload();
        $id = $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->json('data.id');

        $this->apiCall('POST', "/api/v1/admin/challenges/{$id}/review", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'review');
        $this->apiCall('POST', "/api/v1/admin/challenges/{$id}/unpublish", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'draft');
    }

    // --- flags ---

    public function test_flag_endpoints_never_return_flag_material(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        [$payload] = $this->challengePayload();
        $id = $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->json('data.id');

        $plaintext = 'CTF{admin-managed-flag}';

        $store = $this->apiCall('POST', "/api/v1/admin/challenges/{$id}/flags", [
            'flag' => $plaintext,
            'label' => 'main',
            'case_sensitive' => true,
        ], $headers)->assertCreated();

        $flagId = $store->json('data.id');
        $this->assertSame('main', $store->json('data.label'));

        $index = $this->apiCall('GET', "/api/v1/admin/challenges/{$id}/flags", [], $headers)->assertOk();
        $show = $this->apiCall('GET', "/api/v1/admin/challenges/{$id}/flags/{$flagId}", [], $headers)->assertOk();
        $update = $this->apiCall('PUT', "/api/v1/admin/challenges/{$id}/flags/{$flagId}", [
            'is_active' => false,
        ], $headers)->assertOk()->assertJsonPath('data.is_active', false);

        foreach ([$store, $index, $show, $update] as $response) {
            $body = $response->getContent() ?: '';
            foreach (['flag_ciphertext', 'flag_hash', $plaintext] as $forbidden) {
                $this->assertStringNotContainsString($forbidden, $body);
            }
        }

        // Same label stores again = update, not a duplicate row.
        $this->apiCall('POST', "/api/v1/admin/challenges/{$id}/flags", [
            'flag' => 'CTF{rotated-flag}',
            'label' => 'main',
        ], $headers)->assertCreated();

        $this->assertSame(1, Challenge::find($id)->flags()->count());
    }

    // --- audit ---

    public function test_audit_row_written_on_challenge_update(): void
    {
        $admin = User::factory()->admin()->create();
        $headers = $this->headersFor($admin);
        [$payload] = $this->challengePayload();
        $id = $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->json('data.id');

        $this->apiCall('PUT', "/api/v1/admin/challenges/{$id}", ['title' => 'Audited Title'], $headers)->assertOk();

        $log = AuditLog::where('action', 'challenge.updated')->latest('id')->firstOrFail();
        $this->assertSame($admin->id, (int) $log->actor_id);
        $this->assertSame(Challenge::class, $log->auditable_type);
        $this->assertSame($id, (int) $log->auditable_id);
        $this->assertSame('Audited Title', $log->changes['after']['title']);
        $this->assertSame('Forensic Memory Dump', $log->changes['before']['title']);
    }

    public function test_audit_logger_redacts_sensitive_keys_nested(): void
    {
        $admin = User::factory()->admin()->create();
        $request = Request::create('/api/v1/admin/challenges/1', 'PUT', [], [], [], [
            'REMOTE_ADDR' => '10.0.0.1',
            'HTTP_USER_AGENT' => 'AdminTest',
        ]);

        AuditLogger::log($admin, 'test.redaction', Challenge::class, null, [
            'before' => [
                'title' => 'visible',
                'flag_ciphertext' => 'supersecret',
                'nested' => ['password' => 'hunter2', 'authToken' => 'abc', 'FLAG_VALUE' => 'x'],
            ],
            'after' => ['title' => 'visible'],
        ], $request);

        $log = AuditLog::where('action', 'test.redaction')->firstOrFail();
        $this->assertSame('***', $log->changes['before']['flag_ciphertext']);
        $this->assertSame('***', $log->changes['before']['nested']['password']);
        $this->assertSame('***', $log->changes['before']['nested']['authToken']);
        $this->assertSame('***', $log->changes['before']['nested']['FLAG_VALUE']);
        $this->assertSame('visible', $log->changes['before']['title']);
        $this->assertSame('10.0.0.1', $log->ip_address);
        $this->assertStringNotContainsString('supersecret', json_encode($log->changes));
        $this->assertStringNotContainsString('hunter2', json_encode($log->changes));
    }

    public function test_audit_log_index_is_filterable(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        [$payload] = $this->challengePayload();
        $this->apiCall('POST', '/api/v1/admin/challenges', $payload, $headers)->assertCreated();

        $this->apiCall('GET', '/api/v1/admin/audit-logs?action=challenge.created', [], $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'challenge.created');

        $this->apiCall('GET', '/api/v1/admin/audit-logs?action=nope.nothing', [], $headers)
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    // --- users ---

    public function test_last_admin_demotion_is_blocked(): void
    {
        $admin = User::factory()->admin()->create();
        $headers = $this->headersFor($admin);

        $this->apiCall('PUT', "/api/v1/admin/users/{$admin->id}/role", ['role' => 'moderator'], $headers)
            ->assertConflict()
            ->assertJsonPath('error.code', 'conflict');

        $this->assertSame('admin', $admin->refresh()->role->value);

        $second = User::factory()->admin()->create();
        $this->apiCall('PUT', "/api/v1/admin/users/{$admin->id}/role", ['role' => 'moderator'], $headers)
            ->assertOk()
            ->assertJsonPath('data.role', 'moderator');

        $this->assertSame('admin', $second->refresh()->role->value);
    }

    public function test_role_change_is_audited(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $user = User::factory()->create();

        $this->apiCall('PUT', "/api/v1/admin/users/{$user->id}/role", ['role' => 'moderator'], $headers)
            ->assertOk()->assertJsonPath('data.role', 'moderator');

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'user.role_changed',
            'auditable_type' => User::class,
            'auditable_id' => $user->id,
        ]);
    }

    public function test_ban_revokes_tokens_blocks_login_and_api(): void
    {
        $admin = User::factory()->admin()->create();
        $adminHeaders = $this->headersFor($admin);

        $user = User::factory()->create();
        $userHeaders = $this->headersFor($user);
        $userToken = substr($userHeaders['Authorization'], 7);

        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/ban", ['reason' => 'flag sharing'], $adminHeaders)
            ->assertOk()
            ->assertJsonPath('data.role', 'user');

        $this->assertNotNull($user->refresh()->banned_at);

        // Old token is revoked.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$userToken}"])->assertUnauthorized();

        // Login is blocked with the banned code.
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'account_banned');

        // Any surviving token still hits the banned middleware.
        $freshToken = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$freshToken}"])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'account_banned');

        // Ban reason is audited (no column on users in V1).
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.banned', 'auditable_id' => $user->id]);

        // Unban restores access.
        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/unban", [], $adminHeaders)->assertOk();
        $this->assertNull($user->refresh()->banned_at);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
    }

    public function test_xp_adjust_writes_ledger_and_requires_reason(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $user = User::factory()->create();

        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/xp", ['amount' => 50], $headers)
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'validation_failed');

        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/xp", ['amount' => 0, 'reason' => 'zero'], $headers)
            ->assertUnprocessable();

        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/xp", ['amount' => 50, 'reason' => 'event prize'], $headers)
            ->assertOk()
            ->assertJsonPath('data.xp', 50);

        $this->assertDatabaseHas('xp_transactions', [
            'user_id' => $user->id,
            'amount' => 50,
            'reason' => 'admin_adjustment',
            'note' => 'event prize',
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.xp_adjusted', 'auditable_id' => $user->id]);
    }

    public function test_xp_adjustment_cannot_drive_balance_below_zero(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $user = User::factory()->create(['xp' => 10]);

        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/xp", ['amount' => -50, 'reason' => 'penalty'], $headers)
            ->assertUnprocessable();

        $this->apiCall('POST', "/api/v1/admin/users/{$user->id}/xp", ['amount' => -10, 'reason' => 'penalty'], $headers)
            ->assertOk()
            ->assertJsonPath('data.xp', 0);
    }

    // --- hints ---

    public function test_hint_crud(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $challenge = Challenge::factory()->create();

        $hint = $this->apiCall('POST', "/api/v1/admin/challenges/{$challenge->id}/hints", [
            'content' => 'Look at the strings.',
            'cost_points' => 10,
            'position' => 1,
        ], $headers)->assertCreated()->json('data');

        $this->apiCall('GET', "/api/v1/admin/challenges/{$challenge->id}/hints", [], $headers)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->apiCall('PUT', "/api/v1/admin/challenges/{$challenge->id}/hints/{$hint['id']}", [
            'cost_points' => 25,
        ], $headers)->assertOk()->assertJsonPath('data.cost_points', 25);

        $this->apiCall('DELETE', "/api/v1/admin/challenges/{$challenge->id}/hints/{$hint['id']}", [], $headers)
            ->assertOk();

        $this->apiCall('GET', "/api/v1/admin/challenges/{$challenge->id}/hints", [], $headers)
            ->assertOk()->assertJsonCount(0, 'data');
    }

    // --- files ---

    public function test_file_upload_replace_and_delete(): void
    {
        Storage::fake('challenge-files');

        $headers = $this->headersFor(User::factory()->admin()->create());
        $challenge = Challenge::factory()->create();
        $url = "/api/v1/admin/challenges/{$challenge->id}/files";

        $this->app['auth']->forgetGuards();
        $created = $this->post($url, [
            'file' => UploadedFile::fake()->create('evidence.txt', 10, 'text/plain'),
        ], $headers)->assertCreated()->json('data');

        $body = json_encode($created);
        $this->assertStringNotContainsString('storage_key', $body);
        $this->assertSame('evidence.txt', $created['original_name']);

        $row = ChallengeFile::findOrFail($created['id']);
        $oldKey = $row->storage_key;
        $this->assertTrue(Storage::disk('challenge-files')->exists($oldKey));

        $this->app['auth']->forgetGuards();
        $replaced = $this->put("{$url}/{$created['id']}", [
            'file' => UploadedFile::fake()->create('updated.txt', 5, 'text/plain'),
        ], $headers)->assertOk()->json('data');

        $this->assertSame('updated.txt', $replaced['original_name']);
        $this->assertSame(1, ChallengeFile::where('challenge_id', $challenge->id)->count());
        $this->assertFalse(Storage::disk('challenge-files')->exists($oldKey));
        $this->assertTrue(Storage::disk('challenge-files')->exists(ChallengeFile::find($created['id'])->storage_key));

        $this->apiCall('DELETE', "{$url}/{$created['id']}", [], $headers)->assertOk();
        $this->assertSame(0, ChallengeFile::where('challenge_id', $challenge->id)->count());
    }

    // --- taxonomy ---

    public function test_category_and_tag_crud(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());

        $category = $this->apiCall('POST', '/api/v1/admin/categories', [
            'name' => 'Forensics',
            'description' => 'DFIR work.',
            'is_active' => true,
        ], $headers)->assertCreated()->json('data');
        $this->assertNotEmpty($category['slug']);

        $this->apiCall('PUT', "/api/v1/admin/categories/{$category['id']}", ['name' => 'DFIR'], $headers)
            ->assertOk()->assertJsonPath('data.name', 'DFIR');

        $tag = $this->apiCall('POST', '/api/v1/admin/tags', ['name' => 'memory'], $headers)
            ->assertCreated()->json('data');

        $this->apiCall('DELETE', "/api/v1/admin/tags/{$tag['id']}", [], $headers)->assertOk();

        // A category in use cannot be deleted (restrict FK → 409).
        $challenge = Challenge::factory()->create(['category_id' => $category['id']]);
        $this->assertNotNull($challenge->id);
        $this->apiCall('DELETE', "/api/v1/admin/categories/{$category['id']}", [], $headers)
            ->assertConflict();
    }

    // --- paths / modules / lessons / quizzes ---

    public function test_path_module_lesson_quiz_flow_with_transitions(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());

        $path = $this->apiCall('POST', '/api/v1/admin/paths', [
            'title' => 'DFIR Basics',
            'summary' => 'Learn forensics.',
            'difficulty' => 'beginner',
        ], $headers)->assertCreated()->assertJsonPath('data.status', 'draft')->json('data');

        $module = $this->apiCall('POST', "/api/v1/admin/paths/{$path['id']}/modules", [
            'title' => 'Module One',
            'position' => 0,
        ], $headers)->assertCreated()->json('data');

        $lesson = $this->apiCall('POST', "/api/v1/admin/modules/{$module['id']}/lessons", [
            'title' => 'Lesson One',
            'content' => '# Hello',
            'position' => 0,
        ], $headers)->assertCreated()->json('data');
        $this->assertNotEmpty($lesson['slug']);

        // Quiz under a module…
        $moduleQuiz = $this->apiCall('POST', "/api/v1/admin/modules/{$module['id']}/quizzes", [
            'title' => 'Module Quiz',
            'pass_score' => 70,
        ], $headers)->assertCreated()->json('data');

        // …and under a lesson.
        $lessonQuiz = $this->apiCall('POST', "/api/v1/admin/lessons/{$lesson['id']}/quizzes", [
            'title' => 'Lesson Quiz',
        ], $headers)->assertCreated()->json('data');

        $question = $this->apiCall('POST', "/api/v1/admin/quizzes/{$lessonQuiz['id']}/questions", [
            'question' => 'What is 2+2?',
            'type' => 'single',
            'points' => 2,
        ], $headers)->assertCreated()->json('data');

        $optA = $this->apiCall('POST', "/api/v1/admin/questions/{$question['id']}/options", [
            'option_text' => '4',
            'is_correct' => true,
            'position' => 0,
        ], $headers)->assertCreated()->json('data');
        $this->apiCall('POST', "/api/v1/admin/questions/{$question['id']}/options", [
            'option_text' => '5',
            'is_correct' => false,
            'position' => 1,
        ], $headers)->assertCreated();

        // Staff quiz view includes correctness (authoring data).
        $quizView = $this->apiCall('GET', "/api/v1/admin/quizzes/{$lessonQuiz['id']}", [], $headers)
            ->assertOk()->json('data');
        $this->assertTrue($quizView['questions'][0]['options'][0]['is_correct']);
        $this->assertSame($optA['id'], $quizView['questions'][0]['options'][0]['id']);

        // Path publish workflow mirrors challenges.
        $this->apiCall('POST', "/api/v1/admin/paths/{$path['id']}/publish", [], $headers)
            ->assertOk()->assertJsonPath('data.status', 'published');
        $this->assertNotNull(Path::find($path['id'])->published_at);

        $this->apiCall('POST', "/api/v1/admin/paths/{$path['id']}/archive", [], $headers)->assertOk();
        $this->apiCall('POST', "/api/v1/admin/paths/{$path['id']}/publish", [], $headers)->assertConflict();

        // Cleanup nested rows works (cascades + audit).
        $this->apiCall('DELETE', "/api/v1/admin/quizzes/{$moduleQuiz['id']}", [], $headers)->assertOk();
    }

    public function test_lesson_challenge_link_and_unlink(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $module = PathModule::factory()->create();
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);
        $challenge = Challenge::factory()->create();

        $this->apiCall('POST', "/api/v1/admin/lessons/{$lesson->id}/challenges", [
            'challenge_id' => $challenge->id,
        ], $headers)->assertCreated();

        $this->apiCall('GET', "/api/v1/admin/lessons/{$lesson->id}/challenges", [], $headers)
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $challenge->id);

        $this->apiCall('DELETE', "/api/v1/admin/lessons/{$lesson->id}/challenges/{$challenge->id}", [], $headers)
            ->assertOk();

        $this->apiCall('GET', "/api/v1/admin/lessons/{$lesson->id}/challenges", [], $headers)
            ->assertOk()->assertJsonCount(0, 'data');

        $this->apiCall('POST', "/api/v1/admin/lessons/{$lesson->id}/challenges", [
            'challenge_id' => 999999,
        ], $headers)->assertUnprocessable();
    }
}
