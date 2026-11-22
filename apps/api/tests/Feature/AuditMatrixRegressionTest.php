<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\User;
use Database\Factories\ChallengeFileFactory;
use Database\Factories\ChallengeFlagFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Regression tests for the security gaps called out in
 * docs/technical-audit.md §10 and docs/security.md.
 *
 * Kept separate from SecurityTest (which covers the existing upload/flag/
 * IDOR matrix) so this file reads as a single backlog column of the audit.
 */
class AuditMatrixRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_concurrent_solve_falls_back_to_the_unique_index(): void
    {
        $user = User::factory()->create(['xp' => 0, 'solved_count' => 0]);
        $challenge = Challenge::factory()->create(['points' => 100]);
        $flag = ChallengeFlagFactory::withPlaintext($challenge);

        // Simulate the race loser: another solve landed between the
        // challenge fetch and the submit (e.g. two open tabs).
        ChallengeSolve::forceCreate([
            'challenge_id' => $challenge->id,
            'user_id' => $user->id,
            'points_awarded' => 100,
            'hints_used' => 0,
            'solved_at' => now()->subSecond(),
            'created_at' => now()->subSecond(),
        ]);

        $response = $this->postJson(
            "/api/v1/challenges/{$challenge->slug}/submissions",
            ['flag' => $flag['plaintext']],
            $this->tokenHeaders($user),
        );

        $response->assertOk();
        $this->assertTrue($response->json('data.already_solved'));
        $this->assertSame(0, $response->json('data.points_awarded'));

        $user->refresh();

        $this->assertSame(0, $user->xp);
        $this->assertSame(1, $user->solved_count);
    }

    public function test_reset_password_token_is_single_use(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'single-use@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'single-use@example.com'])
            ->assertAccepted();

        $token = null;

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });

        $payload = [
            'token' => $token,
            'email' => 'single-use@example.com',
            'password' => 'brand-new-password-42',
            'password_confirmation' => 'brand-new-password-42',
        ];

        $this->postJson('/api/v1/auth/reset-password', $payload)->assertOk();
        $this->postJson('/api/v1/auth/reset-password', $payload)
            ->assertBadRequest()
            ->assertJsonPath('error.code', 'bad_request');
    }

    public function test_cors_honours_the_configured_frontend_origin_only(): void
    {
        $allowed = config('cors.allowed_origins');

        $this->assertNotEmpty($allowed);

        $frontendOrigin = $allowed[0];

        $this->withHeader('Origin', $frontendOrigin)
            ->getJson('/api/v1/health')
            ->assertHeader('Access-Control-Allow-Origin', $frontendOrigin);

        $evil = $this->withHeader('Origin', 'https://evil.example.com')
            ->getJson('/api/v1/health');

        $this->assertFalse($evil->headers->has('Access-Control-Allow-Origin'));
    }

    public function test_profile_update_cannot_escalate_role_or_xp(): void
    {
        $user = User::factory()->create(['xp' => 10, 'solved_count' => 2]);

        $this->putJson('/api/v1/profile', [
            'name' => 'Learner',
            'role' => 'admin',
            'xp' => 999_999,
            'solved_count' => 999_999,
            'is_admin' => true,
            'banned_at' => now(),
        ], $this->tokenHeaders($user))->assertOk();

        $user->refresh();

        $this->assertSame('user', $user->role->value);
        $this->assertSame(10, $user->xp);
        $this->assertSame(2, $user->solved_count);
        $this->assertNull($user->banned_at);
    }

    public function test_file_id_from_another_challenge_returns_404(): void
    {
        $viewer = User::factory()->create();
        $challengeA = Challenge::factory()->create();
        $challengeB = Challenge::factory()->create();

        $fileB = ChallengeFileFactory::new()->create(['challenge_id' => $challengeB->id]);

        $this->getJson("/api/v1/challenges/{$challengeA->slug}/files/{$fileB->id}/download", $this->tokenHeaders($viewer))
            ->assertNotFound();
    }

    /**
     * @return array<string, string>
     */
    private function tokenHeaders(User $user): array
    {
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }
}
