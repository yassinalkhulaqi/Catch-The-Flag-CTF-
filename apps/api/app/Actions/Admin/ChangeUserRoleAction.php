<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Change a user's role. `role` is never fillable, so this dedicated
 * action is the only writer. Demoting the last remaining admin is
 * refused with 409 — the platform must always have an administrator.
 */
class ChangeUserRoleAction
{
    public function execute(User $actor, User $target, Role $role, Request $request): User
    {
        return DB::transaction(function () use ($actor, $target, $role, $request): User {
            $current = $target->role instanceof Role ? $target->role : Role::from((string) $target->role);

            if ($current === Role::Admin && $role !== Role::Admin) {
                $adminCount = User::where('role', Role::Admin->value)->count();

                if ($adminCount <= 1) {
                    throw new HttpException(409, 'The last administrator cannot be demoted.');
                }
            }

            $before = ['role' => $current->value];

            $target->forceFill(['role' => $role->value])->save();

            AuditLogger::log(
                $actor,
                'user.role_changed',
                User::class,
                $target->id,
                ['before' => $before, 'after' => ['role' => $role->value]],
                $request,
            );

            return $target->refresh();
        });
    }
}
