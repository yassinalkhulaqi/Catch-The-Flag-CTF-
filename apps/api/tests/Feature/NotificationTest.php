<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\AchievementEarnedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_list_and_mark_read(): void
    {
        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];

        $user->notify(new AchievementEarnedNotification(1, 'First Solve', 'Solved one.'));

        $list = $this->getJson('/api/v1/me/notifications', $headers)->assertOk();
        $this->assertSame(1, $list->json('meta.total'));

        $id = $list->json('data.0.id');
        $this->assertNull($list->json('data.0.read_at'));
        $this->assertSame('Achievement unlocked: First Solve', $list->json('data.0.data.title'));

        $this->postJson("/api/v1/me/notifications/{$id}/read", [], $headers)->assertOk();

        $this->assertNotNull($user->notifications()->firstOrFail()->read_at);

        $user->notify(new AchievementEarnedNotification(2, 'Second', 'Solved two.'));
        $this->postJson('/api/v1/me/notifications/read-all', [], $headers)->assertOk();

        $this->assertSame(0, $user->unreadNotifications()->count());
    }

    public function test_cannot_read_another_users_notification(): void
    {
        $owner = User::factory()->create();
        $owner->notify(new AchievementEarnedNotification(1, 'X', 'Y'));
        $id = $owner->notifications()->firstOrFail()->id;

        $other = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$other->createToken('web', ['*'], now()->addDay())->plainTextToken];

        $this->postJson("/api/v1/me/notifications/{$id}/read", [], $headers)->assertNotFound();
    }
}
