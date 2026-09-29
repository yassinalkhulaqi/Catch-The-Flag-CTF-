<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Quiz;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class QuizPolicy
{
    use ChecksRoles;

    public function view(User $user, Quiz $quiz): bool
    {
        if ($this->isStaff($user)) {
            return true;
        }

        if (! $quiz->is_published) {
            return false;
        }

        $quiz->loadMissing(['lesson.module.path', 'module.path']);
        $path = $quiz->lesson?->module?->path ?? $quiz->module?->path;

        return $path !== null && $this->published($path);
    }

    public function attempt(User $user, Quiz $quiz): bool
    {
        return $this->view($user, $quiz) && ! $user->isBanned();
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, Quiz $quiz): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, Quiz $quiz): bool
    {
        return $this->isStaff($user);
    }
}
