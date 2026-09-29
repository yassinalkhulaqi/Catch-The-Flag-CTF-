<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Achievement;
use Illuminate\Notifications\Notification;

/**
 * Durable in-app notification when an achievement is awarded.
 * Database channel only in V1 — no realtime websocket fan-out.
 */
final class AchievementUnlockedNotification extends Notification
{
    public function __construct(private Achievement $achievement) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array{title: string, body: string, url: string, achievement_id: int, achievement_key: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Achievement unlocked',
            'body' => $this->achievement->title,
            'url' => '/achievements',
            'achievement_id' => (int) $this->achievement->id,
            'achievement_key' => (string) $this->achievement->key,
        ];
    }
}
