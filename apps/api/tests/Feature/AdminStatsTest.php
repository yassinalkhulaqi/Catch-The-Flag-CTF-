<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\Path;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /admin/stats — the real counts mounted on the staff overview
 * (docs/technical-audit.md, M8). No invented series; just the truth.
 */
class AdminStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_stats_require_staff(): void
    {
        $this->getJson('/api/v1/admin/stats')->assertUnauthorized();
        $this->getJson('/api/v1/admin/stats', $this->headersFor(User::factory()->create()))->assertForbidden();
        $this->getJson('/api/v1/admin/stats', $this->headersFor(User::factory()->moderator()->create()))->assertOk();
        $this->getJson('/api/v1/admin/stats', $this->headersFor(User::factory()->admin()->create()))->assertOk();
    }

    public function test_stats_counts_match_the_database(): void
    {
        User::factory()->count(2)->create();
        User::factory()->banned()->create();

        Challenge::factory()->count(2)->create();            // published (factory default)
        Challenge::factory()->draft()->create();
        Challenge::factory()->review()->create();
        Challenge::factory()->archived()->create();

        Path::factory()->create();                           // published
        Path::factory()->draft()->create();
        Path::factory()->review()->create();

        $response = $this->getJson('/api/v1/admin/stats', $this->headersFor(User::factory()->admin()->create()));

        $response->assertOk();

        $data = $response->json('data');

        $this->assertSame(4, $data['users']);
        $this->assertSame(1, $data['users_banned']);
        $this->assertSame(2, $data['challenges_published']);
        $this->assertSame(1, $data['challenges_draft']);
        $this->assertSame(1, $data['challenges_review']);
        $this->assertSame(1, $data['challenges_archived']);
        $this->assertSame(1, $data['paths_published']);
        $this->assertSame(1, $data['paths_draft']);
        $this->assertSame(1, $data['paths_review']);
        $this->assertArrayNotHasKey('password', $data);
        $this->assertArrayNotHasKey('email', $data);
    }

    /**
     * @return array<string, string>
     */
    private function headersFor(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $token = $user->createToken('test', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }
}
