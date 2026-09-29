<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Achievement;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class AchievementPolicy
{
    use ChecksRoles;

    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Achievement $achievement): bool
    {
        return $achievement->is_active || $this->isStaff($user);
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, Achievement $achievement): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, Achievement $achievement): bool
    {
        return $this->isAdmin($user);
    }
}
