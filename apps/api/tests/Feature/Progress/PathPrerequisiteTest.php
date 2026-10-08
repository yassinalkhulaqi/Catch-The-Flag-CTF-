<?php

declare(strict_types=1);

namespace Tests\Feature\Progress;

use App\Enums\PathProgressStatus;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\User;
use App\Models\UserPathProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class PathPrerequisiteTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_learner_cannot_start_or_open_a_path_until_prerequisites_are_complete(): void
    {
        $user = User::factory()->create();
        $intro = Path::factory()->published()->create(['title' => 'Intro to SOC']);
        $next = Path::factory()->published()->create(['title' => 'SOC Cases']);
        $next->prerequisites()->sync([$intro->id]);
        $module = PathModule::factory()->create(['path_id' => $next->id, 'is_published' => true]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id, 'is_published' => true]);

        $this->actingAsApi($user)->postJson("/api/v1/paths/{$next->id}/start")
            ->assertStatus(422)
            ->assertJsonPath('error.fields.path.0', 'Complete the required paths before starting this one: Intro to SOC.');

        $this->actingAsApi($user)->getJson("/api/v1/modules/{$module->id}")
            ->assertForbidden()
            ->assertJsonPath('error.message', 'Complete the required paths before starting this one: Intro to SOC.');

        $this->actingAsApi($user)->getJson("/api/v1/lessons/{$lesson->id}")
            ->assertForbidden();

        $detail = $this->actingAsApi($user)->getJson("/api/v1/paths/{$next->slug}")->assertOk();
        $detail->assertJsonPath('data.can_start', false);
        $detail->assertJsonPath('data.started', false);
        $detail->assertJsonPath('data.prerequisites.0.slug', $intro->slug);
        $detail->assertJsonPath('data.prerequisites.0.completed', false);

        UserPathProgress::query()->forceCreate([
            'user_id' => $user->id,
            'path_id' => $intro->id,
            'status' => PathProgressStatus::Completed->value,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAsApi($user)->postJson("/api/v1/paths/{$next->id}/start")
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        $this->actingAsApi($user)->getJson("/api/v1/paths/{$next->slug}")
            ->assertOk()
            ->assertJsonPath('data.can_start', true)
            ->assertJsonPath('data.started', true)
            ->assertJsonPath('data.prerequisites.0.completed', true);

        $this->actingAsApi($user)->getJson("/api/v1/lessons/{$lesson->id}")->assertOk();
    }

    public function test_an_in_progress_path_stays_open_after_a_prerequisite_is_added(): void
    {
        $user = User::factory()->create();
        $intro = Path::factory()->published()->create(['title' => 'Intro']);
        $next = Path::factory()->published()->create(['title' => 'Next']);
        UserPathProgress::query()->create([
            'user_id' => $user->id,
            'path_id' => $next->id,
            'status' => PathProgressStatus::InProgress->value,
            'started_at' => now(),
        ]);
        $next->prerequisites()->sync([$intro->id]);
        $module = PathModule::factory()->create(['path_id' => $next->id, 'is_published' => true]);

        $this->actingAsApi($user)->postJson("/api/v1/paths/{$next->id}/start")->assertOk();
        $this->actingAsApi($user)->getJson("/api/v1/modules/{$module->id}")->assertOk();
    }

    public function test_unpublished_prerequisites_do_not_block_and_are_hidden(): void
    {
        $user = User::factory()->create();
        $draft = Path::factory()->create(['title' => 'Secret draft']);
        $next = Path::factory()->published()->create();
        $next->prerequisites()->sync([$draft->id]);

        $this->actingAsApi($user)->postJson("/api/v1/paths/{$next->id}/start")->assertOk();
        $this->actingAsApi($user)->getJson("/api/v1/paths/{$next->slug}")
            ->assertOk()
            ->assertJsonPath('data.prerequisites', [])
            ->assertJsonPath('data.can_start', true);
    }

    public function test_staff_can_open_a_locked_path(): void
    {
        $moderator = User::factory()->moderator()->create();
        $intro = Path::factory()->published()->create();
        $next = Path::factory()->published()->create();
        $next->prerequisites()->sync([$intro->id]);
        $module = PathModule::factory()->create(['path_id' => $next->id, 'is_published' => true]);

        $this->actingAsApi($moderator)->getJson("/api/v1/modules/{$module->id}")->assertOk();
        $this->actingAsApi($moderator)->postJson("/api/v1/paths/{$next->id}/start")->assertOk();
    }

    public function test_prerequisite_cycles_are_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $first = Path::factory()->published()->create();
        $second = Path::factory()->published()->create();
        $first->prerequisites()->sync([$second->id]);

        $this->actingAsApi($admin)->putJson("/api/v1/admin/paths/{$second->id}", [
            'prerequisite_ids' => [$first->id],
        ])->assertStatus(422);

        $fields = $this->actingAsApi($admin)->putJson("/api/v1/admin/paths/{$second->id}", [
            'prerequisite_ids' => [$second->id],
        ])->assertStatus(422)->json('error.fields');

        $this->assertSame('A path cannot require itself.', $fields['prerequisite_ids'][0]);
    }
}
