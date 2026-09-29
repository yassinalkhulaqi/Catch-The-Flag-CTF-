<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;
use App\Services\AuditLogger;

final class BanUserAction
{
    public function __construct(private AuditLogger $audit) {}

    public function ban(User $actor, User $target): User
    {
        $target->forceFill(['banned_at' => now()])->save();
        $target->tokens()->delete();

        $this->audit->log($actor, 'user.ban', $target, [
            'before' => ['banned_at' => null],
            'after' => ['banned_at' => $target->banned_at?->toIso8601String()],
        ]);

        return $target->refresh();
    }

    public function unban(User $actor, User $target): User
    {
        $before = $target->banned_at;
        $target->forceFill(['banned_at' => null])->save();

        $this->audit->log($actor, 'user.unban', $target, [
            'before' => ['banned_at' => $before?->toIso8601String()],
            'after' => ['banned_at' => null],
        ]);

        return $target->refresh();
    }
}
