<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Models\XpTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Staff analytics aggregates (docs/product.md §7). Every number is a direct
 * count over the source-of-truth tables — these tests keep them honest.
 */
class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_summary_matches_the_database(): void
    {
        $user = User::factory()->create();
        $challenger = Challenge::factory()->create();

        ChallengeSubmission::forceCreate([
            'challenge_id' => $challenger->id,
            'user_id' => $user->id,
            'flag_hash' => str_repeat('a', 64),
            'is_correct' => true,
            'ip_address' => '203.0.113.5',
            'user_agent' => 'test',
            'created_at' => now(),
        ]);

        ChallengeSolve::forceCreate([
            'challenge_id' => $challenger->id,
            'user_id' => $user->id,
            'points_awarded' => 100,
            'hints_used' => 0,
            'solved_at' => now(),
            'created_at' => now(),
        ]);

        XpTransaction::create([
            'user_id' => $user->id,
            'amount' => 100,
            'reason' => 'challenge_solve',
            'reference_type' => Challenge::class,
            'reference_id' => $challenger->id,
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/admin/analytics/summary', $this->headersFor(User::factory()->admin()->create()));

        $response->assertOk();

        $data = $response->json('data');

        $this->assertSame(2, $data['users']);
        $this->assertSame(100, $data['xp_total']);
        $this->assertSame(1, $data['solves_total']);
        $this->assertSame(1, $data['submissions_total']);
        $this->assertSame(1, $data['challenges_published']);
        $this->assertEquals(100.0, $data['solve_rate']);
        $this->assertGreaterThanOrEqual(1, $data['active_learners_30d']);
    }

    public function test_summary_requires_staff(): void
    {
        $this->getJson('/api/v1/admin/analytics/summary')->assertUnauthorized();
        $this->getJson('/api/v1/admin/analytics/summary', $this->headersFor(User::factory()->create()))->assertForbidden();
        $this->getJson('/api/v1/admin/analytics/categories', $this->headersFor(User::factory()->moderator()->create()))->assertOk();
        $this->getJson('/api/v1/admin/analytics/xp', $this->headersFor(User::factory()->moderator()->create()))->assertOk();
    }

    public function test_per_category_funnel_computes_rates(): void
    {
        $web = Category::factory()->create(['name' => 'Web', 'slug' => 'web']);
        $crypto = Category::factory()->create(['name' => 'Crypto', 'slug' => 'crypto']);

        $webChallenge = Challenge::factory()->create(['category_id' => $web->id]);
        $cryptoChallenge = Challenge::factory()->create(['category_id' => $crypto->id]);

        $user = User::factory()->create();

        ChallengeSubmission::forceCreate([
            'challenge_id' => $webChallenge->id,
            'user_id' => $user->id,
            'flag_hash' => str_repeat('b', 64),
            'is_correct' => true,
            'created_at' => now(),
        ]);
        ChallengeSolve::forceCreate([
            'challenge_id' => $webChallenge->id,
            'user_id' => $user->id,
            'points_awarded' => 50,
            'solved_at' => now(),
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/admin/analytics/categories', $this->headersFor(User::factory()->admin()->create()));

        $response->assertOk();

        $rows = collect($response->json('data'))->keyBy('slug');

        $this->assertSame(1, $rows['web']['solves']);
        $this->assertSame(1, $rows['web']['attempts']);
        $this->assertEquals(100.0, $rows['web']['solve_rate']);
        $this->assertEquals(0.0, $rows['crypto']['solve_rate']);
        $this->assertSame(1, $rows['crypto']['published']);
    }

    public function test_xp_series_is_continuous_and_days_are_bounded(): void
    {
        $user = User::factory()->create();

        XpTransaction::create([
            'user_id' => $user->id,
            'amount' => 25,
            'reason' => 'lesson_complete',
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/admin/analytics/xp?days=14', $this->headersFor(User::factory()->admin()->create()));

        $response->assertOk();

        $series = $response->json('data.series');

        $this->assertCount(14, $series);
        $this->assertSame(now()->toDateString(), end($series)['day']);
        $this->assertSame(25, end($series)['xp']);
        $this->assertSame(0, $series[0]['xp']);

        $this->getJson('/api/v1/admin/analytics/xp?days=3', $this->headersFor(User::factory()->admin()->create()))
            ->assertStatus(422);
    }

    /**
     * @return array<string, string>
     */
    private function headersFor(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }
}
