<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class RateLimitAndAttemptsTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_max_attempts_blocks_further_submissions(): void
    {
        $user = User::factory()->create();
        $challenge = $this->makePublishedChallenge('CTF{ok}', ['max_attempts' => 2]);

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{wrong1}',
        ])->assertOk()->assertJsonPath('data.result', 'incorrect');

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{wrong2}',
        ])->assertOk()->assertJsonPath('data.result', 'incorrect');

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{ok}',
        ])->assertStatus(429);
    }

    public function test_per_challenge_submit_throttle_returns_429(): void
    {
        RateLimiter::for('submit-challenge', function () {
            return Limit::perMinute(2);
        });

        $user = User::factory()->create();
        $challenge = $this->makePublishedChallenge('CTF{ok}');

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{a}',
        ])->assertOk();
        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{b}',
        ])->assertOk();

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{c}',
        ])->assertStatus(429);
    }

    public function test_profile_rejects_unsafe_avatar_and_ignores_role_xp(): void
    {
        $user = User::factory()->create(['xp' => 10, 'role' => 'user']);

        $this->actingAsApi($user)->putJson('/api/v1/profile', [
            'avatar_path' => '../evil.png',
        ])->assertStatus(422);

        $this->actingAsApi($user)->putJson('/api/v1/profile', [
            'name' => 'Safe Name',
            'role' => 'admin',
            'xp' => 99999,
            'solved_count' => 50,
        ])->assertOk();

        $user->refresh();
        $this->assertSame('user', $user->role?->value ?? (string) $user->role);
        $this->assertSame(10, (int) $user->xp);
        $this->assertSame('Safe Name', $user->name);
    }

    public function test_last_admin_cannot_be_demoted(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAsApi($admin)->putJson("/api/v1/admin/users/{$admin->id}/role", [
            'role' => 'user',
        ])->assertStatus(409);

        $this->assertSame('admin', $admin->fresh()->role?->value ?? (string) $admin->fresh()->role);
    }

    public function test_moderator_cannot_access_admin_users(): void
    {
        $mod = User::factory()->moderator()->create();

        $this->actingAsApi($mod)->getJson('/api/v1/admin/users')->assertForbidden();
        $this->actingAsApi($mod)->getJson('/api/v1/admin/stats')->assertOk();
    }
}
