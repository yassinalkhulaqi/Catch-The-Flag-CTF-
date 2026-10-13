<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\ChallengeHint;
use App\Models\HintUnlock;
use App\Models\User;
use Database\Factories\ChallengeFlagFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HintUnlockTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{Challenge, ChallengeHint, array<string, string>} */
    private function makeFixture(): array
    {
        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $challenge = Challenge::factory()->create(['points' => 100]);
        $hint = ChallengeHint::factory()->for($challenge)->create([
            'content' => 'Look at the PNG ancillary chunks.',
            'cost_points' => 25,
            'position' => 1,
        ]);

        return [$challenge, $hint, $headers, $user];
    }

    public function test_unlock_reveals_content_and_points_remaining(): void
    {
        [$challenge, $hint, $headers] = $this->makeFixture();

        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/hints/{$hint->id}/unlock",
            [],
            $headers
        )->assertOk()
            ->assertJsonPath('data.hint.content', 'Look at the PNG ancillary chunks.')
            ->assertJsonPath('data.points_remaining', 75)
            ->assertJsonPath('data.already_unlocked', false);
    }

    public function test_unlock_is_idempotent(): void
    {
        [$challenge, $hint, $headers] = $this->makeFixture();
        $url = "/api/v1/challenges/{$challenge->id}/hints/{$hint->id}/unlock";

        $this->postJson($url, [], $headers)->assertOk();
        $this->postJson($url, [], $headers)->assertOk()
            ->assertJsonPath('data.already_unlocked', true)
            ->assertJsonPath('data.points_remaining', 75);

        $this->assertSame(1, HintUnlock::query()->count());
    }

    public function test_solve_awards_points_minus_hint_cost(): void
    {
        [$challenge, $hint, $headers, $user] = $this->makeFixture();
        $flag = ChallengeFlagFactory::withPlaintext($challenge);

        $this->postJson("/api/v1/challenges/{$challenge->id}/hints/{$hint->id}/unlock", [], $headers)->assertOk();
        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => $flag['plaintext']],
            $headers
        )->assertOk()->assertJsonPath('data.points_awarded', 75);

        $this->assertSame(75, (int) $user->refresh()->xp);
    }

    public function test_hint_from_another_challenge_is_404(): void
    {
        [$challenge, , $headers] = $this->makeFixture();
        $other = ChallengeHint::factory()->create();

        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/hints/{$other->id}/unlock",
            [],
            $headers
        )->assertNotFound();
    }

    public function test_guest_cannot_unlock(): void
    {
        $challenge = Challenge::factory()->create();
        $hint = ChallengeHint::factory()->for($challenge)->create();

        $this->postJson("/api/v1/challenges/{$challenge->id}/hints/{$hint->id}/unlock", [])
            ->assertUnauthorized();
    }
}
