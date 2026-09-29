<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class UserPolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id || $this->isAdmin($user);
    }

    public function update(User $user, User $model): bool
    {
        return $user->id === $model->id || $this->isAdmin($user);
    }

    public function updateRole(User $user, User $model): bool
    {
        return $this->isAdmin($user);
    }

    public function ban(User $user, User $model): bool
    {
        return $this->isAdmin($user) && $user->id !== $model->id;
    }

    public function adjustXp(User $user, User $model): bool
    {
        return $this->isAdmin($user);
    }
}
