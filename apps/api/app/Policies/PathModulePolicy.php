<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\PathModule;
use App\Models\User;

class PathModulePolicy
{
    public function view(?User $user, PathModule $module): bool
    {
        if ($user !== null && $user->hasRole(Role::Moderator)) {
            return true;
        }

        return $module->is_published && $module->path->status->isVisible();
    }
}
