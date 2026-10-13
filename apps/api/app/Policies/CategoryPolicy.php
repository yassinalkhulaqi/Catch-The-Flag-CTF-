<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Category;
use App\Models\User;

/**
 * Categories are governed by is_active (docs/api.md §3: "active
 * items only"). Guests and learners see active categories;
 * moderators and admins see all.
 */
class CategoryPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Category $category): bool
    {
        if ($category->is_active) {
            return true;
        }

        return $user !== null && $user->hasRole(Role::Moderator);
    }
}
