<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use App\Services\AuditLogger;
use App\Services\LoginThrottle;
use Illuminate\Http\Request;

/**
 * Clear a login lockout (docs/security.md §2).
 *
 * A support action: someone whose account locked during a real login attempt
 * can reach out, and an admin can release the lock without a database write.
 * The attempt window is 15 minutes by default; this exists for the rare case
 * where repeated windows still leave the account locked.
 */
class UnlockUserAction
{
    public function __construct(private readonly LoginThrottle $throttle) {}

    public function execute(User $actor, User $target, Request $request): User
    {
        $before = $this->throttle->attempts($target->email);

        $this->throttle->clear($target->email);

        AuditLogger::log(
            $actor,
            'user.unlocked',
            User::class,
            $target->id,
            ['before' => ['login_attempts' => $before], 'after' => ['login_attempts' => 0]],
            $request,
        );

        return $target;
    }
}
