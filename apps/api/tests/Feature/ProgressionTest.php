<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\User;
use App\Notifications\PathCompletedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{User, array<string, string>, Path, PathModule, Lesson} */
    private function makeFixture(): array
    {
        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $path = Path::factory()->create();
        $module = PathModule::factory()->for($path)->create();
        $lesson = Lesson::factory()->for($module, 'module')->create();

        return [$user, $headers, $path, $module, $lesson];
    }

    public function test_start_path_is_idempotent(): void
    {
        [$user, $headers, $path] = $this->makeFixture();
        $url = "/api/v1/paths/{$path->slug}/start";

        $this->postJson($url, [], $headers)->assertCreated();
        $this->postJson($url, [], $headers)->assertCreated();

        $this->assertSame(1, $user->pathProgress()->count());
    }

    public function test_complete_lesson_awards_xp_once(): void
    {
        [$user, $headers, , , $lesson] = $this->makeFixture();
        $url = "/api/v1/lessons/{$lesson->id}/complete";

        $this->postJson($url, [], $headers)->assertOk()
            ->assertJsonPath('data.completed', true)
            ->assertJsonPath('data.already_completed', false);

        $this->postJson($url, [], $headers)->assertOk()
            ->assertJsonPath('data.already_completed', true);

        $this->assertSame((int) config('ctf.xp.lesson_complete'), (int) $user->refresh()->xp);
        $this->assertDatabaseHas('xp_transactions', [
            'user_id' => $user->id,
            'reason' => 'lesson_complete',
        ]);
    }

    public function test_path_completion_awards_bonus_and_notifies(): void
    {
        [$user, $headers, $path, , $lesson] = $this->makeFixture();

        $this->postJson("/api/v1/paths/{$path->id}/start", [], $headers)->assertCreated();
        $this->postJson("/api/v1/lessons/{$lesson->id}/complete", [], $headers)->assertOk();

        $progress = $user->pathProgress()->where('path_id', $path->id)->firstOrFail();
        $this->assertSame('completed', $progress->status->value);

        $expected = (int) config('ctf.xp.lesson_complete') + (int) config('ctf.xp.path_complete');
        $this->assertSame($expected, (int) $user->refresh()->xp);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'type' => PathCompletedNotification::class,
        ]);
    }

    public function test_me_progress_overview_shape(): void
    {
        [$user, $headers, $path, , $lesson] = $this->makeFixture();

        $this->postJson("/api/v1/paths/{$path->id}/start", [], $headers)->assertCreated();
        $this->postJson("/api/v1/lessons/{$lesson->id}/complete", [], $headers)->assertOk();

        $this->getJson('/api/v1/me/progress', $headers)->assertOk()
            ->assertJsonPath('data.paths_started', 1)
            ->assertJsonPath('data.paths_completed', 1)
            ->assertJsonPath('data.lessons_completed', 1)
            ->assertJsonStructure(['data' => [
                'paths_started', 'paths_completed', 'lessons_completed',
                'challenges_solved', 'xp', 'rank', 'streak_days',
            ]]);
    }

    public function test_lesson_detail_shows_content_and_completion(): void
    {
        [$user, $headers, , , $lesson] = $this->makeFixture();

        $this->getJson("/api/v1/lessons/{$lesson->id}", $headers)->assertOk()
            ->assertJsonPath('data.content', "# Lesson\n\nLearn things.\n")
            ->assertJsonPath('data.completed', false);

        $this->postJson("/api/v1/lessons/{$lesson->id}/complete", [], $headers)->assertOk();

        $this->getJson("/api/v1/lessons/{$lesson->id}", $headers)->assertOk()
            ->assertJsonPath('data.completed', true);
    }
}
