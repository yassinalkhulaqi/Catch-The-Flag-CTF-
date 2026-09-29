<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\QuizAttempt;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class QuizAttemptPolicy
{
    use ChecksRoles;

    public function view(User $user, QuizAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id || $this->isStaff($user);
    }

    public function answer(User $user, QuizAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id && ! $attempt->isCompleted() && ! $user->isBanned();
    }

    public function submit(User $user, QuizAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id && ! $user->isBanned();
    }
}
