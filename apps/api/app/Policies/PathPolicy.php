<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Path;
use App\Models\User;

/**
 * Learners and guests see published paths only. Moderators and
 * admins see every status.
 */
class PathPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Path $path): bool
    {
        if ($path->status?->isVisible() ?? $path->status === 'published') {
            return true;
        }

        return $user !== null && $user->hasRole(Role::Moderator);
    }
}
