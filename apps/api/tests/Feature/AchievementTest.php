<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Challenge;
use App\Models\User;
use App\Notifications\AchievementEarnedNotification;
use Database\Factories\AchievementFactory;
use Database\Factories\ChallengeFlagFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AchievementTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_solve_awards_configured_achievements(): void
    {
        Achievement::factory()->create([
            'key' => 'first-solve',
            'criteria' => ['type' => 'solves_total', 'threshold' => 1],
            'points' => 50,
        ]);

        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $challenge = Challenge::factory()->create(['points' => 100]);
        $flag = ChallengeFlagFactory::withPlaintext($challenge);

        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => $flag['plaintext']],
            $headers
        )->assertOk();

        // 100 solve XP + 50 achievement bonus.
        $this->assertSame(150, (int) $user->refresh()->xp);

        $this->assertDatabaseHas('user_achievements', ['user_id' => $user->id]);
        $this->assertDatabaseHas('xp_transactions', [
            'user_id' => $user->id,
            'reason' => 'achievement',
            'amount' => 50,
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'type' => AchievementEarnedNotification::class,
        ]);
    }

    public function test_achievements_are_idempotent_across_solves(): void
    {
        Achievement::factory()->create([
            'key' => 'first-solve',
            'criteria' => ['type' => 'solves_total', 'threshold' => 1],
            'points' => 50,
        ]);

        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];

        foreach ([100, 200] as $points) {
            $challenge = Challenge::factory()->create(['points' => $points]);
            $flag = ChallengeFlagFactory::withPlaintext($challenge);
            $this->postJson(
                "/api/v1/challenges/{$challenge->id}/submissions",
                ['flag' => $flag['plaintext']],
                $headers
            )->assertOk();
        }

        $this->assertSame(1, $user->achievements()->count());
        $this->assertSame(350, (int) $user->refresh()->xp);
    }

    public function test_first_blood_goes_to_earliest_solver(): void
    {
        Achievement::factory()->create([
            'key' => 'first-blood',
            'criteria' => ['type' => 'first_blood', 'threshold' => 1],
            'points' => 25,
        ]);

        $challenge = Challenge::factory()->create(['points' => 100]);
        $flag = ChallengeFlagFactory::withPlaintext($challenge);

        $first = User::factory()->create();
        $firstHeaders = ['Authorization' => 'Bearer '.$first->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => $flag['plaintext']],
            $firstHeaders
        )->assertOk();

        $second = User::factory()->create();
        $secondHeaders = ['Authorization' => 'Bearer '.$second->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $this->postJson(
            "/api/v1/challenges/{$challenge->id}/submissions",
            ['flag' => $flag['plaintext']],
            $secondHeaders
        )->assertOk();

        $this->assertSame(1, $first->achievements()->count());
        $this->assertSame(0, $second->achievements()->count());
    }

    public function test_me_achievements_reports_awarded_and_progress(): void
    {
        AchievementFactory::new()->create([
            'key' => 'solve-ten',
            'criteria' => ['type' => 'solves_total', 'threshold' => 10],
            'points' => 50,
        ]);

        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];

        $response = $this->getJson('/api/v1/me/achievements', $headers)->assertOk();

        $row = $response->json('data.0');
        $this->assertFalse($row['awarded']);
        $this->assertSame(['current' => 0, 'target' => 10], $row['progress']);
    }
}
