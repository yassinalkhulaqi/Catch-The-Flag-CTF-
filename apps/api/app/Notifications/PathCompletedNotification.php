<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Learning path completed (docs/database.md §9).
 */
class PathCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $pathId,
        private readonly string $pathTitle,
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
            'title' => "Path completed: {$this->pathTitle}",
            'body' => 'Every module finished. On to the next path.',
            'url' => '/progress',
            'path_id' => $this->pathId,
        ];
    }
}
