<?php

declare(strict_types=1);

namespace Tests\Feature\Challenge;

use App\Enums\ContentStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class FlagSubmissionTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_correct_wrong_and_duplicate_flag_submissions(): void
    {
        $user = User::factory()->create();
        $challenge = $this->makePublishedChallenge('CTF{correct}');

        $wrong = $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{wrong}',
        ]);
        $wrong->assertOk()->assertJsonPath('data.result', 'incorrect');
        $wrong->assertJsonMissingPath('data.flag');
        $this->assertSame(0, (int) $user->fresh()->xp);

        $correct = $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{correct}',
        ]);
        $correct->assertOk()
            ->assertJsonPath('data.result', 'correct')
            ->assertJsonPath('data.already_solved', false)
            ->assertJsonPath('data.points_awarded', 100);

        $user->refresh();
        $this->assertSame(100, (int) $user->xp);
        $this->assertSame(1, (int) $user->solved_count);
        $this->assertSame(1, (int) $challenge->fresh()->solve_count);

        $dup = $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{correct}',
        ]);
        $dup->assertOk()
            ->assertJsonPath('data.result', 'correct')
            ->assertJsonPath('data.already_solved', true);
        $this->assertSame(100, (int) $user->fresh()->xp);
    }

    public function test_flag_secrets_never_appear_in_challenge_responses(): void
    {
        $user = User::factory()->create();
        $challenge = $this->makePublishedChallenge('CTF{secret_never_leak}');

        $show = $this->actingAsApi($user)->getJson("/api/v1/challenges/{$challenge->id}");
        $show->assertOk();
        $payload = json_encode($show->json());
        $this->assertStringNotContainsString('CTF{secret_never_leak}', $payload);
        $this->assertStringNotContainsString('flag_ciphertext', $payload);
        $this->assertStringNotContainsString('flag_hash', $payload);

        $admin = User::factory()->admin()->create();
        $flags = $this->actingAsApi($admin)->getJson("/api/v1/admin/challenges/{$challenge->id}/flags");
        $flags->assertOk();
        $adminPayload = json_encode($flags->json());
        $this->assertStringNotContainsString('CTF{secret_never_leak}', $adminPayload);
        $this->assertStringNotContainsString('flag_ciphertext', $adminPayload);
        $this->assertStringNotContainsString('flag_hash', $adminPayload);
    }

    public function test_unpublished_challenge_is_hidden_from_learners(): void
    {
        $user = User::factory()->create();
        $challenge = $this->makePublishedChallenge();
        $challenge->forceFill(['status' => ContentStatus::Draft->value, 'published_at' => null])->save();

        $this->actingAsApi($user)->getJson("/api/v1/challenges/{$challenge->id}")
            ->assertForbidden();

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'CTF{test_flag}',
        ])->assertForbidden();
    }
}
