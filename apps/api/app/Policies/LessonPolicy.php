<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Lesson;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class LessonPolicy
{
    use ChecksRoles;

    public function view(User $user, Lesson $lesson): bool
    {
        if ($this->isStaff($user)) {
            return true;
        }

        $lesson->loadMissing('module.path');

        return $lesson->is_published
            && $lesson->module?->is_published
            && $lesson->module?->path
            && $this->published($lesson->module->path);
    }

    public function complete(User $user, Lesson $lesson): bool
    {
        return $this->view($user, $lesson) && ! $user->isBanned();
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, Lesson $lesson): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, Lesson $lesson): bool
    {
        return $this->isStaff($user);
    }
}
