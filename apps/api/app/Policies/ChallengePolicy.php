<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Challenge;
use App\Models\User;

/**
 * Learners and guests see published challenges only. Moderators and
 * admins (role hierarchy via User::hasRole) see every status.
 * Controllers turn denials on detail endpoints into 404 (no
 * existence oracle, docs/api.md §1.1).
 */
class ChallengePolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Challenge $challenge): bool
    {
        if ($challenge->status?->isVisible() ?? $challenge->status === 'published') {
            return true;
        }

        return $user !== null && $user->hasRole(Role::Moderator);
    }
}
