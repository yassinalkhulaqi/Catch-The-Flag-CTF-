<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Path;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class PathPolicy
{
    use ChecksRoles;

    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Path $path): bool
    {
        if ($this->published($path)) {
            return true;
        }

        return $this->isStaff($user);
    }

    public function start(User $user, Path $path): bool
    {
        return $this->published($path) && ! $user->isBanned();
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, Path $path): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, Path $path): bool
    {
        return $this->isStaff($user);
    }

    public function publish(User $user, Path $path): bool
    {
        return $this->isStaff($user);
    }
}
