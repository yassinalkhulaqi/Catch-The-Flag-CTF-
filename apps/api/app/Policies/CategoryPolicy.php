<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class CategoryPolicy
{
    use ChecksRoles;

    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Category $category): bool
    {
        return $category->is_active || $this->isStaff($user);
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, Category $category): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, Category $category): bool
    {
        return $this->isAdmin($user);
    }
}
