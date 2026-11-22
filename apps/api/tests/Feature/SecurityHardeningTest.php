<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Branch 2 security hardening (docs/technical-audit.md §10, docs/security.md §2).
 *
 * Covers the account-lockout lifecycle and the session-management API.
 */
class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function credentials(string $password = 'sup3r-secret-passw0rd'): array
    {
        return [
            'email' => 'lockout-subject@example.com',
            'password' => $password,
        ];
    }

    private function makeLockoutTarget(): User
    {
        return User::factory()->create([
            'email' => 'lockout-subject@example.com',
            'password' => Hash::make('sup3r-secret-passw0rd'),
        ]);
    }

    private function failedLogin(array $headers = []): TestResponse
    {
        return $this->postJson('/api/v1/auth/login', $this->credentials('definitely-wrong-passw0rd'), $headers);
    }

    public function test_locked_account_cannot_keep_trying(): void
    {
        $this->makeLockoutTarget();

        for ($i = 0; $i < 5; $i++) {
            $this->failedLogin();
        }

        $this->postJson('/api/v1/auth/login', $this->credentials())
            ->assertTooManyRequests()
            ->assertJsonPath('error.code', 'rate_limited')
            ->assertHeader('Retry-After');
    }

    public function test_lockout_is_driven_by_config(): void
    {
        config(['ctf.security.lockout_max_attempts' => 2]);

        $this->makeLockoutTarget();

        $this->failedLogin();
        $this->failedLogin();

        $this->failedLogin()->assertTooManyRequests();
    }

    public function test_successful_login_clears_failed_attempts(): void
    {
        $this->makeLockoutTarget();

        for ($i = 0; $i < 4; $i++) {
            $this->failedLogin();
        }

        $this->postJson('/api/v1/auth/login', $this->credentials())->assertOk();

        for ($i = 0; $i < 4; $i++) {
            $this->failedLogin();
        }

        // Still not locked: the counter was cleared by the success.
        $this->failedLogin()->assertStatus(422);
    }

    public function test_wrong_password_stays_indistinguishable_from_unknown_email(): void
    {
        $this->makeLockoutTarget();

        $known = $this->failedLogin()->json();

        $unknown = $this->postJson('/api/v1/auth/login', [
            'email' => 'no-such-user@example.com',
            'password' => 'definitely-wrong-passw0rd',
        ])->json();

        $this->assertSame($known['error']['code'], $unknown['error']['code']);
        $this->assertSame($known['error']['message'], $unknown['error']['message']);
    }

    public function test_admin_can_unlock_a_locked_account(): void
    {
        $user = $this->makeLockoutTarget();

        for ($i = 0; $i < 5; $i++) {
            $this->failedLogin();
        }

        $this->postJson('/api/v1/auth/login', $this->credentials())
            ->assertTooManyRequests();

        $admin = User::factory()->admin()->create();
        $headers = $this->tokenHeaders($admin);

        $this->postJson("/api/v1/admin/users/{$user->id}/unlock", [], $headers)
            ->assertOk();

        $this->postJson('/api/v1/auth/login', $this->credentials())->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'user.unlocked',
            'auditable_type' => User::class,
            'auditable_id' => $user->id,
            'actor_id' => $admin->id,
        ]);
    }

    public function test_moderator_cannot_unlock_a_locked_account(): void
    {
        $user = $this->makeLockoutTarget();
        $moderator = User::factory()->moderator()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->failedLogin();
        }

        $this->postJson(
            "/api/v1/admin/users/{$user->id}/unlock",
            [],
            $this->tokenHeaders($moderator),
        )->assertForbidden();
    }

    public function test_sessions_endpoint_lists_only_the_current_users_sessions(): void
    {
        $this->makeLockoutTarget();

        $login = $this->postJson('/api/v1/auth/login', $this->credentials(), [
            'User-Agent' => 'Firefox/120.0 (Windows NT 10.0; x64)',
        ]);

        $login->assertOk();

        $token = $login->json('data.token');

        $sessions = $this->getJson('/api/v1/auth/sessions', ['Authorization' => "Bearer {$token}"]);

        $sessions->assertOk();

        $body = (string) $sessions->getContent();

        $this->assertStringNotContainsString($token, $body);
        $this->assertSame('Firefox/120.0 (Windows NT 10.0; x64)', $sessions->json('data.sessions.0.name'));
        $this->assertTrue($sessions->json('data.sessions.0.current'));
        $this->assertNotNull($sessions->json('data.current_id'));
        $this->assertNotNull($sessions->json('data.sessions.0.created_at'));
    }

    public function test_session_revoke_rejects_other_users_tokens(): void
    {
        $mine = $this->makeLockoutTarget();

        $other = User::factory()->create(['password' => Hash::make('other-secret-passw0rd-1')]);
        $otherLogin = $this->postJson('/api/v1/auth/login', [
            'email' => $other->email,
            'password' => 'other-secret-passw0rd-1',
        ])->assertOk();

        $otherId = $this->getJson('/api/v1/auth/sessions', [
            'Authorization' => 'Bearer '.$otherLogin->json('data.token'),
        ])->json('data.sessions.0.id');

        $mineToken = $this->postJson('/api/v1/auth/login', $this->credentials())->assertOk()->json('data.token');

        $this->deleteJson("/api/v1/auth/sessions/{$otherId}", [], ['Authorization' => "Bearer {$mineToken}"])
            ->assertNotFound();
    }

    public function test_revoking_the_current_session_logs_the_browser_out(): void
    {
        $this->makeLockoutTarget();

        $token = $this->postJson('/api/v1/auth/login', $this->credentials())->assertOk()->json('data.token');
        $tokenId = $this->getJson('/api/v1/auth/sessions', ['Authorization' => "Bearer {$token}"])->json('data.sessions.0.id');

        $this->deleteJson("/api/v1/auth/sessions/{$tokenId}", [], ['Authorization' => "Bearer {$token}"])
            ->assertOk();

        $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$token}"])->assertStatus(401);
    }

    public function test_session_names_come_from_a_sanitised_user_agent(): void
    {
        $this->makeLockoutTarget();

        $hostile = "Mozilla/5.0\r\nX-Injected: yes".str_repeat('a', 500);

        $token = $this->postJson('/api/v1/auth/login', $this->credentials(), ['User-Agent' => $hostile])
            ->assertOk()
            ->json('data.token');

        $name = $this->getJson('/api/v1/auth/sessions', ['Authorization' => "Bearer {$token}"])
            ->json('data.sessions.0.name');

        $this->assertStringNotContainsString("\r", $name);
        $this->assertStringNotContainsString("\n", $name);
        $this->assertLessThanOrEqual(80, mb_strlen($name));
    }

    public function test_role_change_revokes_active_sessions(): void
    {
        $user = $this->makeLockoutTarget();

        $session = $this->postJson('/api/v1/auth/login', $this->credentials())->assertOk()->json('data.token');
        $admin = User::factory()->admin()->create();

        $this->putJson(
            "/api/v1/admin/users/{$user->id}/role",
            ['role' => 'moderator'],
            $this->tokenHeaders($admin),
        )->assertOk();

        $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$session}"])->assertStatus(401);
    }

    public function test_password_change_revokes_other_sessions(): void
    {
        $user = $this->makeLockoutTarget();

        $token = $this->postJson('/api/v1/auth/login', $this->credentials())->assertOk()->json('data.token');
        $other = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        $this->putJson('/api/v1/profile/password', [
            'current_password' => 'sup3r-secret-passw0rd',
            'password' => 'brand-new-password-99',
            'password_confirmation' => 'brand-new-password-99',
        ], ['Authorization' => "Bearer {$token}"])->assertOk();

        // The other session is dead; the current one survives.
        $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$other}"])->assertStatus(401);
        $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$token}"])->assertOk();
    }

    /**
     * @return array<string, string>
     */
    private function tokenHeaders(User $user): array
    {
        $token = $user->createToken('test', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }
}
