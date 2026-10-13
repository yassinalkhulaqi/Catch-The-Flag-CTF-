<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Services\FlagValidator;
use Database\Factories\ChallengeFlagFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(?User $user = null): array
    {
        $user ??= User::factory()->create();
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return [$user, ['Authorization' => "Bearer {$token}"]];
    }

    private function challengeWithFlag(int $points = 100): array
    {
        $challenge = Challenge::factory()->create(['points' => $points]);
        $flag = ChallengeFlagFactory::withPlaintext($challenge);

        return [$challenge, $flag['plaintext']];
    }

    public function test_correct_flag_awards_full_points_and_xp(): void
    {
        [$user, $headers] = $this->tokenFor();
        [$challenge, $plaintext] = $this->challengeWithFlag();

        $response = $this->postJson(
            "/api/v1/challenges/{$challenge->slug}/submissions",
            ['flag' => $plaintext],
            $headers
        );

        $response->assertOk()
            ->assertJsonPath('data.result', 'correct')
            ->assertJsonPath('data.points_awarded', 100)
            ->assertJsonPath('data.xp_total', 100);

        $this->assertSame(100, (int) $user->refresh()->xp);
        $this->assertSame(1, (int) $user->solved_count);
        $this->assertSame(1, (int) $challenge->refresh()->solve_count);
        $this->assertDatabaseHas('challenge_solves', [
            'challenge_id' => $challenge->id,
            'user_id' => $user->id,
            'points_awarded' => 100,
        ]);
        $this->assertDatabaseHas('xp_transactions', [
            'user_id' => $user->id,
            'amount' => 100,
            'reason' => 'challenge_solve',
        ]);
    }

    public function test_duplicate_solve_awards_nothing(): void
    {
        [$user, $headers] = $this->tokenFor();
        [$challenge, $plaintext] = $this->challengeWithFlag();
        $url = "/api/v1/challenges/{$challenge->id}/submissions";

        $this->postJson($url, ['flag' => $plaintext], $headers)->assertOk();
        $this->postJson($url, ['flag' => $plaintext], $headers)->assertOk()
            ->assertJsonPath('data.result', 'correct')
            ->assertJsonPath('data.points_awarded', 0)
            ->assertJsonPath('data.already_solved', true);

        $this->assertSame(100, (int) $user->refresh()->xp);
        $this->assertSame(1, Challenge::find($challenge->id)->solves()->where('user_id', $user->id)->count());
    }

    public function test_wrong_flag_records_failure_without_rewards(): void
    {
        [$user, $headers] = $this->tokenFor();
        [$challenge] = $this->challengeWithFlag();

        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => 'CTF{definitely-wrong}'],
            $headers
        )->assertOk()->assertJsonPath('data.result', 'incorrect');

        $this->assertSame(0, (int) $user->refresh()->xp);
        $this->assertDatabaseHas('challenge_submissions', [
            'challenge_id' => $challenge->id,
            'user_id' => $user->id,
            'is_correct' => false,
        ]);
    }

    public function test_submitted_plaintext_is_never_stored(): void
    {
        [$user, $headers] = $this->tokenFor();
        [$challenge, $plaintext] = $this->challengeWithFlag();

        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => $plaintext],
            $headers
        )->assertOk();

        $this->assertDatabaseMissing('challenge_submissions', ['flag_hash' => $plaintext]);
        $stored = ChallengeSubmission::query()
            ->where('challenge_id', $challenge->id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        $this->assertSame(FlagValidator::hash($plaintext), $stored->flag_hash);
    }

    public function test_responses_never_contain_flag_material(): void
    {
        [$user, $headers] = $this->tokenFor();
        [$challenge, $plaintext] = $this->challengeWithFlag();

        $response = $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => $plaintext],
            $headers
        );

        $body = $response->getContent() ?: '';
        foreach (['flag_ciphertext', 'flag_hash', 'flag_plaintext', $plaintext] as $forbidden) {
            $this->assertStringNotContainsString($forbidden, $body);
        }
    }

    public function test_unpublished_challenge_is_404(): void
    {
        [, $headers] = $this->tokenFor();
        $challenge = Challenge::factory()->draft()->create();
        ChallengeFlagFactory::withPlaintext($challenge);

        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => 'CTF{x}'],
            $headers
        )->assertNotFound()->assertJsonPath('error.code', 'not_found');
    }

    public function test_guest_submission_is_401(): void
    {
        [$challenge] = $this->challengeWithFlag();

        $this->postJson("/api/v1/challenges/{$challenge->id}/submissions", ['flag' => 'CTF{x}'])
            ->assertUnauthorized();
    }

    public function test_submissions_are_rate_limited_per_challenge(): void
    {
        [, $headers] = $this->tokenFor();
        [$challenge] = $this->challengeWithFlag();
        $url = "/api/v1/challenges/{$challenge->id}/submissions";

        for ($i = 0; $i < 10; $i++) {
            $this->postJson($url, ['flag' => 'CTF{wrong-'.$i.'}'], $headers)->assertOk();
        }

        $this->postJson($url, ['flag' => 'CTF{one-too-many}'], $headers)
            ->assertTooManyRequests()
            ->assertJsonPath('error.code', 'rate_limited');
    }
}
