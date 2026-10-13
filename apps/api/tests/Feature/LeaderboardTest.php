<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_is_xp_then_solves_then_id(): void
    {
        $low = User::factory()->create(['xp' => 100, 'solved_count' => 5]);
        $mid = User::factory()->create(['xp' => 200, 'solved_count' => 1]);
        $tieHigh = User::factory()->create(['xp' => 200, 'solved_count' => 3]);
        $tieLow = User::factory()->create(['xp' => 200, 'solved_count' => 3]);
        User::factory()->banned()->create(['xp' => 99999, 'solved_count' => 99]);

        $response = $this->getJson('/api/v1/leaderboard');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();

        // Banned whale excluded; ties broken by ascending id.
        $this->assertSame([$tieHigh->id, $tieLow->id, $mid->id, $low->id], $ids);
        $this->assertSame([1, 2, 3, 4], collect($response->json('data'))->pluck('rank')->all());
        $this->assertSame(1, $response->json('meta.current_page'));
        $this->assertArrayHasKey('total', $response->json('meta'));
    }

    public function test_me_returns_own_rank(): void
    {
        User::factory()->create(['xp' => 500, 'solved_count' => 9]);
        $user = User::factory()->create(['xp' => 100, 'solved_count' => 2]);
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        $this->getJson('/api/v1/leaderboard/me', ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->assertJsonPath('data.rank', 2)
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_me_requires_auth(): void
    {
        $this->getJson('/api/v1/leaderboard/me')->assertUnauthorized();
    }
}
