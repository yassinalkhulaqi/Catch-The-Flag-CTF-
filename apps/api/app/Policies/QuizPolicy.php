<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Quiz;
use App\Models\User;

class QuizPolicy
{
    public function view(?User $user, Quiz $quiz): bool
    {
        if ($user !== null && $user->hasRole(Role::Moderator)) {
            return true;
        }

        if (! $quiz->is_published) {
            return false;
        }

        if ($quiz->lesson !== null) {
            return $quiz->lesson->is_published
                && $quiz->lesson->module->is_published
                && $quiz->lesson->module->path->status->isVisible();
        }

        if ($quiz->module !== null) {
            return $quiz->module->is_published
                && $quiz->module->path->status->isVisible();
        }

        return false;
    }
}
