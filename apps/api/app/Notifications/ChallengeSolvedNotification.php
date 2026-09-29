<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Challenge;
use Illuminate\Notifications\Notification;

/**
 * Durable in-app notification for a first-time challenge solve.
 */
final class ChallengeSolvedNotification extends Notification
{
    public function __construct(
        private Challenge $challenge,
        private int $pointsAwarded,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array{title: string, body: string, url: string, challenge_id: int, points: int}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Challenge solved',
            'body' => sprintf('%s (+%d points)', $this->challenge->title, $this->pointsAwarded),
            'url' => '/challenges/'.$this->challenge->slug,
            'challenge_id' => (int) $this->challenge->id,
            'points' => $this->pointsAwarded,
        ];
    }
}
