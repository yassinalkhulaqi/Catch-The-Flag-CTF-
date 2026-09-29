<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Challenge;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class ChallengePolicy
{
    use ChecksRoles;

    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Challenge $challenge): bool
    {
        if ($this->published($challenge)) {
            return true;
        }

        return $this->isStaff($user);
    }

    public function submit(User $user, Challenge $challenge): bool
    {
        return $this->published($challenge) && ! $user->isBanned();
    }

    public function download(User $user, Challenge $challenge): bool
    {
        return $this->view($user, $challenge) && ! $user->isBanned();
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, Challenge $challenge): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, Challenge $challenge): bool
    {
        return $this->isStaff($user);
    }

    public function publish(User $user, Challenge $challenge): bool
    {
        return $this->isStaff($user);
    }
}
