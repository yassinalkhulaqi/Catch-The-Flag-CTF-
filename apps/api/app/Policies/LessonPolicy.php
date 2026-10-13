<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Lesson;
use App\Models\User;

class LessonPolicy
{
    public function view(?User $user, Lesson $lesson): bool
    {
        if ($user !== null && $user->hasRole(Role::Moderator)) {
            return true;
        }

        return $lesson->is_published
            && $lesson->module->is_published
            && $lesson->module->path->status->isVisible();
    }
}
