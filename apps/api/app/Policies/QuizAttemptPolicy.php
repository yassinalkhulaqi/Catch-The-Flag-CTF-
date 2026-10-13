<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\QuizAttempt;
use App\Models\User;

class QuizAttemptPolicy
{
    public function view(User $user, QuizAttempt $attempt): bool
    {
        return (int) $attempt->user_id === (int) $user->id;
    }

    public function answer(User $user, QuizAttempt $attempt): bool
    {
        return (int) $attempt->user_id === (int) $user->id;
    }
}
