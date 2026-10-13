<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Achievement earned (docs/database.md §9). Payload is UI copy only —
 * no flags, no secrets.
 */
class AchievementEarnedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $achievementId,
        private readonly string $title,
        private readonly string $description,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Achievement unlocked: {$this->title}",
            'body' => $this->description,
            'url' => '/achievements',
            'achievement_id' => $this->achievementId,
        ];
    }
}
