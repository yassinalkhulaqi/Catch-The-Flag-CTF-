<?php

declare(strict_types=1);

namespace App\Services\FlagValidators;

use App\Models\Challenge;
use App\Models\User;

interface FlagValidator
{
    public function validate(Challenge $challenge, User $user, string $submittedFlag): bool;
}
