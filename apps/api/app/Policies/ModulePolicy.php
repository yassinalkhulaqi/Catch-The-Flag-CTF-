<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PathModule;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class ModulePolicy
{
    use ChecksRoles;

    public function view(User $user, PathModule $module): bool
    {
        if ($this->isStaff($user)) {
            return true;
        }

        $module->loadMissing('path');

        return $module->is_published && $module->path && $this->published($module->path);
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, PathModule $module): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, PathModule $module): bool
    {
        return $this->isStaff($user);
    }
}
