<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Suspend or reinstate an account (docs/security.md §2). Banning stamps
 * banned_at and revokes every API token immediately; the ban reason has
 * no column in the V1 users schema, so it is recorded in the audit
 * diff. Login and all authenticated routes reject banned users.
 */
class BanUserAction
{
    public function execute(User $actor, User $target, string $reason, Request $request): User
    {
        return DB::transaction(function () use ($actor, $target, $reason, $request): User {
            $before = ['banned_at' => $target->banned_at?->toISOString()];

            $target->forceFill(['banned_at' => now()])->save();
            $target->tokens()->delete();

            AuditLogger::log(
                $actor,
                'user.banned',
                User::class,
                $target->id,
                ['before' => $before, 'after' => ['banned_at' => $target->refresh()->banned_at?->toISOString(), 'reason' => $reason]],
                $request,
            );

            return $target->refresh();
        });
    }

    public function unban(User $actor, User $target, Request $request): User
    {
        return DB::transaction(function () use ($actor, $target, $request): User {
            $before = ['banned_at' => $target->banned_at?->toISOString()];

            $target->forceFill(['banned_at' => null])->save();

            AuditLogger::log(
                $actor,
                'user.unbanned',
                User::class,
                $target->id,
                ['before' => $before, 'after' => ['banned_at' => null]],
                $request,
            );

            return $target->refresh();
        });
    }
}
