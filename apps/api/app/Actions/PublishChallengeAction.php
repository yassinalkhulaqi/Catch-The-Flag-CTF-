<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\ContentStatus;
use App\Models\Challenge;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Validation\ValidationException;

final class PublishChallengeAction
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(User $actor, Challenge $challenge): Challenge
    {
        if ($challenge->flags()->active()->count() < 1) {
            throw ValidationException::withMessages([
                'flags' => ['A challenge must have at least one active flag before publishing.'],
            ]);
        }

        $from = $challenge->status?->value ?? (string) $challenge->status;
        $challenge->forceFill([
            'status' => ContentStatus::Published->value,
            'published_at' => $challenge->published_at ?? now(),
        ])->save();

        $this->audit->log($actor, 'challenge.publish', $challenge, [
            'before' => ['status' => $from],
            'after' => ['status' => ContentStatus::Published->value],
        ]);

        return $challenge->refresh();
    }
}
