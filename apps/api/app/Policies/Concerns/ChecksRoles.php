<?php

declare(strict_types=1);

namespace App\Policies\Concerns;

use App\Enums\ContentStatus;
use App\Enums\Role;
use App\Models\User;

trait ChecksRoles
{
    protected function isStaff(?User $user): bool
    {
        return $user !== null && $user->isAtLeast(Role::Moderator);
    }

    protected function isAdmin(?User $user): bool
    {
        return $user !== null && $user->isAdmin();
    }

    protected function published($model): bool
    {
        $status = $model->status ?? null;
        if ($status instanceof ContentStatus) {
            return $status === ContentStatus::Published;
        }

        return (string) $status === ContentStatus::Published->value;
    }
}
