<?php

declare(strict_types=1);

namespace Tests\Feature\Me;

use App\Models\Achievement;
use App\Models\User;
use App\Notifications\AchievementUnlockedNotification;
use App\Notifications\ChallengeSolvedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class SettingsAndNotificationsTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_settings_theme_persists(): void
    {
        $user = User::factory()->create();

        $this->actingAsApi($user)->getJson('/api/v1/me/settings')
            ->assertOk()
            ->assertJsonPath('data.theme', 'system');

        $this->actingAsApi($user)->putJson('/api/v1/me/settings', ['theme' => 'dark'])
            ->assertOk()
            ->assertJsonPath('data.theme', 'dark');

        $this->assertSame('dark', $user->fresh()->themePreference());

        $this->actingAsApi($user)->getJson('/api/v1/me/settings')
            ->assertOk()
            ->assertJsonPath('data.theme', 'dark');

        $this->actingAsApi($user)->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.theme', 'dark');
    }

    public function test_correct_solve_creates_database_notification(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $challenge = $this->makePublishedChallenge(flag: 'flag{notify-me}');

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'flag{notify-me}',
        ])->assertOk()->assertJsonPath('data.result', 'correct');

        Notification::assertSentTo($user, ChallengeSolvedNotification::class);
    }

    public function test_achievement_award_notifies_user(): void
    {
        Notification::fake();
        $user = User::factory()->create(['solved_count' => 0]);
        Achievement::query()->create([
            'key' => 'first_solve',
            'title' => 'First Solve',
            'description' => 'Solve one challenge',
            'criteria' => ['type' => 'solves_total', 'threshold' => 1],
            'points' => 10,
            'is_active' => true,
            'sort_order' => 1,
        ]);
        $challenge = $this->makePublishedChallenge(flag: 'flag{achieve}');

        $this->actingAsApi($user)->postJson("/api/v1/challenges/{$challenge->id}/submissions", [
            'flag' => 'flag{achieve}',
        ])->assertOk();

        Notification::assertSentTo($user, AchievementUnlockedNotification::class);
    }

    public function test_notifications_list_and_mark_read(): void
    {
        $user = User::factory()->create();
        $user->notify(new AchievementUnlockedNotification(
            Achievement::query()->create([
                'key' => 'test_badge',
                'title' => 'Test Badge',
                'description' => 'Test',
                'criteria' => ['type' => 'solves_total', 'threshold' => 99],
                'points' => 0,
                'is_active' => true,
                'sort_order' => 99,
            ])
        ));

        $list = $this->actingAsApi($user)->getJson('/api/v1/me/notifications');
        $list->assertOk();
        $id = $list->json('data.0.id');
        $this->assertNotEmpty($id);
        $this->assertNull($list->json('data.0.read_at'));

        $this->actingAsApi($user)->postJson("/api/v1/me/notifications/{$id}/read")
            ->assertOk();

        $after = $this->actingAsApi($user)->getJson('/api/v1/me/notifications')->assertOk();
        $this->assertNotNull($after->json('data.0.read_at'));
    }
}
