<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Tag;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class TagPolicy
{
    use ChecksRoles;

    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Tag $tag): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, Tag $tag): bool
    {
        return $this->isStaff($user);
    }
}
