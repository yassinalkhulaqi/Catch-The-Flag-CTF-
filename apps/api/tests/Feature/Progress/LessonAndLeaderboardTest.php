<?php

declare(strict_types=1);

namespace Tests\Feature\Progress;

use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class LessonAndLeaderboardTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_lesson_complete_awards_xp(): void
    {
        $user = User::factory()->create();
        $path = Path::factory()->published()->create();
        // Two modules so completing one lesson does not complete the whole path
        $module = PathModule::factory()->create(['path_id' => $path->id, 'is_published' => true, 'position' => 1]);
        PathModule::factory()->create(['path_id' => $path->id, 'is_published' => true, 'position' => 2]);
        Lesson::factory()->create(['module_id' => $module->id, 'is_published' => true, 'position' => 2]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id, 'is_published' => true, 'position' => 1]);

        $response = $this->actingAsApi($user)->postJson("/api/v1/lessons/{$lesson->id}/complete");

        $response->assertOk();
        $this->assertSame((int) config('ctf.xp.lesson_complete', 10), (int) $user->fresh()->xp);
        $this->assertDatabaseHas('lesson_completions', [
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
        ]);
    }

    public function test_leaderboard_ordering_is_deterministic(): void
    {
        User::factory()->create(['name' => 'A', 'xp' => 100, 'solved_count' => 2]);
        $b = User::factory()->create(['name' => 'B', 'xp' => 100, 'solved_count' => 5]);
        User::factory()->create(['name' => 'C', 'xp' => 200, 'solved_count' => 1]);
        $d = User::factory()->create(['name' => 'D', 'xp' => 100, 'solved_count' => 5]);

        $tied = collect([$b, $d])->sortBy('id')->values();
        $expected = ['C', $tied[0]->name, $tied[1]->name, 'A'];

        $response = $this->getJson('/api/v1/leaderboard');
        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();

        $this->assertSame($expected, array_slice($names, 0, 4));
        $ranks = collect($response->json('data'))->pluck('rank')->all();
        $this->assertSame([1, 2, 3, 4], array_slice($ranks, 0, 4));
    }
}
