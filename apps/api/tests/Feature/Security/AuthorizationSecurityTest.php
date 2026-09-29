<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class AuthorizationSecurityTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_unauthorized_admin_access_is_forbidden(): void
    {
        $user = User::factory()->create();
        $this->actingAsApi($user)->getJson('/api/v1/admin/stats')->assertForbidden();
        $this->actingAsApi($user)->getJson('/api/v1/admin/users')->assertForbidden();
    }

    public function test_file_download_requires_auth_and_published_challenge(): void
    {
        Storage::fake('challenge-files');
        $challenge = $this->makePublishedChallenge();
        $file = $this->attachTextFile($challenge, 'payload');

        $this->getJson("/api/v1/challenges/{$challenge->id}/files/{$file->id}")
            ->assertUnauthorized();

        $user = User::factory()->create();
        $this->actingAsApi($user)
            ->get("/api/v1/challenges/{$challenge->id}/files/{$file->id}")
            ->assertOk();
    }

    public function test_upload_sanitizes_path_traversal_filenames(): void
    {
        Storage::fake('challenge-files');
        $admin = User::factory()->admin()->create();
        $challenge = $this->makePublishedChallenge();

        $upload = UploadedFile::fake()->createWithContent('../../etc/passwd.txt', "not a real passwd\n");

        $response = $this->actingAsApi($admin)->post(
            "/api/v1/admin/challenges/{$challenge->id}/files",
            ['file' => $upload],
        );

        $response->assertCreated();
        $name = $response->json('data.original_name');
        $this->assertSame('passwd.txt', $name);
        $this->assertStringNotContainsString('..', $response->json('data.download_url'));
        $storageKey = $challenge->files()->first()->storage_key;
        $this->assertStringNotContainsString('..', $storageKey);
        $this->assertDoesNotMatchRegularExpression('#^/#', $storageKey);
    }

    public function test_rate_limiting_smoke_on_login(): void
    {
        User::factory()->create([
            'email' => 'rate@example.com',
            'password' => bcrypt('SecurePassw0rd!'),
        ]);

        $hitLimit = false;
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'rate@example.com',
                'password' => 'wrong-password-xx',
            ]);
            if ($response->status() === 429) {
                $hitLimit = true;
                $response->assertJsonPath('error.code', 'rate_limited');
                break;
            }
        }

        $this->assertTrue($hitLimit, 'Expected login rate limit to trigger');
    }
}
