<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Achievement;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class AdminAchievementTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_staff_can_create_an_achievement_and_learners_do_not_see_authoring_fields(): void
    {
        $moderator = User::factory()->moderator()->create();
        $learner = User::factory()->create();

        $created = $this->actingAsApi($moderator)->postJson('/api/v1/admin/achievements', [
            'key' => 'solver_3',
            'title' => 'Three Down',
            'description' => 'Solve three challenges.',
            'icon' => 'trophy',
            'criteria' => ['type' => 'solves_total', 'threshold' => 3],
            'points' => 40,
            'is_active' => true,
            'sort_order' => 5,
        ]);

        $created->assertCreated()
            ->assertJsonPath('data.key', 'solver_3')
            ->assertJsonPath('data.criteria.type', 'solves_total')
            ->assertJsonPath('data.criteria.threshold', 3)
            ->assertJsonPath('data.points', 40)
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.awarded_count', 0);

        $this->assertDatabaseHas('achievements', ['key' => 'solver_3', 'points' => 40]);
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $moderator->id,
            'action' => 'achievement.create',
        ]);

        $learnerPayload = $this->actingAsApi($learner)->getJson('/api/v1/me/achievements')
            ->assertOk()
            ->json('data.0');

        foreach (['criteria', 'points', 'is_active', 'sort_order', 'awarded_count'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $learnerPayload);
        }
    }

    public function test_category_solves_requires_a_real_category(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $missing = $this->actingAsApi($admin)->postJson('/api/v1/admin/achievements', [
            'key' => 'crypto_2',
            'title' => 'Crypto Pair',
            'description' => 'Solve two cryptography challenges.',
            'criteria' => ['type' => 'category_solves', 'threshold' => 2],
        ])->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed');

        $this->assertSame(
            'A category is required for category solve achievements.',
            $missing->json('error.fields')['criteria.category_id'][0],
        );

        $this->actingAsApi($admin)->postJson('/api/v1/admin/achievements', [
            'key' => 'crypto_2',
            'title' => 'Crypto Pair',
            'description' => 'Solve two cryptography challenges.',
            'criteria' => [
                'type' => 'category_solves',
                'threshold' => 2,
                'category_id' => $category->id,
            ],
        ])->assertCreated()
            ->assertJsonPath('data.criteria.category_id', $category->id);
    }

    public function test_unknown_criteria_type_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();

        $invalid = $this->actingAsApi($admin)->postJson('/api/v1/admin/achievements', [
            'key' => 'nope',
            'title' => 'Nope',
            'description' => 'Invalid rule.',
            'criteria' => ['type' => 'shell_access', 'threshold' => 1],
        ])->assertStatus(422);

        $this->assertSame(
            'Criteria type must be one of the supported achievement rules.',
            $invalid->json('error.fields')['criteria.type'][0],
        );

        $this->assertDatabaseMissing('achievements', ['key' => 'nope']);
    }

    public function test_unknown_criteria_keys_are_not_stored(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAsApi($admin)->postJson('/api/v1/admin/achievements', [
            'key' => 'clean_rule',
            'title' => 'Clean Rule',
            'description' => 'Only known criteria fields persist.',
            'criteria' => ['type' => 'solves_total', 'threshold' => 1, 'note' => 'ignore me'],
        ])->assertCreated();

        $this->assertSame(
            ['type' => 'solves_total', 'threshold' => 1],
            Achievement::query()->where('key', 'clean_rule')->firstOrFail()->criteria,
        );
    }

    public function test_database_rejects_criteria_without_a_threshold(): void
    {
        $this->assertCriteriaRejected(['type' => 'solves_total']);
    }

    public function test_database_rejects_fractional_thresholds(): void
    {
        $this->assertCriteriaRejected(['type' => 'solves_total', 'threshold' => 1.5]);
    }

    public function test_database_rejects_category_solves_without_a_category(): void
    {
        $this->assertCriteriaRejected(['type' => 'category_solves', 'threshold' => 1]);
    }

    /**
     * @param  array<string, mixed>  $criteria
     */
    private function assertCriteriaRejected(array $criteria): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Achievement::query()->create([
            'key' => 'bad_shape',
            'title' => 'Bad Shape',
            'description' => 'Invalid criteria.',
            'criteria' => $criteria,
            'points' => 0,
            'is_active' => true,
            'sort_order' => 0,
        ]);
    }

    public function test_update_cannot_change_the_key_and_records_an_audit(): void
    {
        $admin = User::factory()->admin()->create();
        $achievement = $this->makeAchievement();

        $this->actingAsApi($admin)->putJson("/api/v1/admin/achievements/{$achievement->id}", [
            'key' => 'renamed',
        ])->assertStatus(422)
            ->assertJsonPath('error.fields.key.0', 'The achievement key cannot be changed.');

        $this->actingAsApi($admin)->putJson("/api/v1/admin/achievements/{$achievement->id}", [
            'title' => 'Updated title',
            'is_active' => false,
            'points' => 15,
        ])->assertOk()
            ->assertJsonPath('data.title', 'Updated title')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.key', 'solver_10')
            ->assertJsonPath('data.points', 15);

        $this->assertTrue(
            AuditLog::query()->where('action', 'achievement.update')->where('actor_id', $admin->id)->exists()
        );
    }

    public function test_admin_index_includes_award_counts_and_inactive_rows(): void
    {
        $admin = User::factory()->admin()->create();
        $learner = User::factory()->create();
        $active = $this->makeAchievement();
        $inactive = Achievement::query()->create([
            'key' => 'retired',
            'title' => 'Retired',
            'description' => 'No longer awarded.',
            'criteria' => ['type' => 'xp_total', 'threshold' => 100],
            'points' => 0,
            'is_active' => false,
            'sort_order' => 9,
        ]);
        UserAchievement::query()->create([
            'user_id' => $learner->id,
            'achievement_id' => $active->id,
            'awarded_at' => now(),
        ]);

        $index = $this->actingAsApi($admin)->getJson('/api/v1/admin/achievements')->assertOk();
        $rows = collect($index->json('data'));

        $this->assertTrue($rows->contains(fn ($row) => $row['key'] === 'solver_10' && $row['awarded_count'] === 1));
        $this->assertTrue($rows->contains(fn ($row) => $row['key'] === 'retired' && $row['is_active'] === false));

        $learnerKeys = collect(
            $this->actingAsApi($learner)->getJson('/api/v1/me/achievements')->assertOk()->json('data')
        )->pluck('key');
        $this->assertTrue($learnerKeys->contains('solver_10'));
        $this->assertFalse($learnerKeys->contains('retired'));

        $this->assertNotNull($inactive->id);
    }

    public function test_only_admins_can_delete_and_deletion_removes_awards(): void
    {
        $admin = User::factory()->admin()->create();
        $moderator = User::factory()->moderator()->create();
        $learner = User::factory()->create();
        $achievement = $this->makeAchievement();
        UserAchievement::query()->create([
            'user_id' => $learner->id,
            'achievement_id' => $achievement->id,
            'awarded_at' => now(),
        ]);

        $this->actingAsApi($learner)->deleteJson("/api/v1/admin/achievements/{$achievement->id}")
            ->assertForbidden();
        $this->actingAsApi($moderator)->deleteJson("/api/v1/admin/achievements/{$achievement->id}")
            ->assertForbidden();
        $this->assertDatabaseHas('achievements', ['id' => $achievement->id]);

        $this->actingAsApi($admin)->deleteJson("/api/v1/admin/achievements/{$achievement->id}")
            ->assertOk()
            ->assertJsonPath('data.ok', true);

        $this->assertDatabaseMissing('achievements', ['id' => $achievement->id]);
        $this->assertDatabaseMissing('user_achievements', ['achievement_id' => $achievement->id]);
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $admin->id,
            'action' => 'achievement.delete',
        ]);
    }

    public function test_guests_and_learners_cannot_create_achievements(): void
    {
        $this->postJson('/api/v1/admin/achievements', [
            'key' => 'guest',
            'title' => 'Guest',
            'description' => 'Nope',
            'criteria' => ['type' => 'solves_total', 'threshold' => 1],
        ])->assertUnauthorized();

        $this->actingAsApi(User::factory()->create())->postJson('/api/v1/admin/achievements', [
            'key' => 'learner',
            'title' => 'Learner',
            'description' => 'Nope',
            'criteria' => ['type' => 'solves_total', 'threshold' => 1],
        ])->assertForbidden();
    }

    private function makeAchievement(): Achievement
    {
        return Achievement::query()->create([
            'key' => 'solver_10',
            'title' => 'Rising Solver',
            'description' => 'Solve 10 challenges.',
            'icon' => 'star',
            'criteria' => ['type' => 'solves_total', 'threshold' => 10],
            'points' => 50,
            'is_active' => true,
            'sort_order' => 2,
        ]);
    }
}
