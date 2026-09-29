<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ChallengeHint;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class ChallengeHintPolicy
{
    use ChecksRoles;

    public function unlock(User $user, ChallengeHint $hint): bool
    {
        $hint->loadMissing('challenge');

        return $hint->challenge
            && $this->published($hint->challenge)
            && ! $user->isBanned();
    }

    public function manage(User $user, ChallengeHint $hint): bool
    {
        return $this->isStaff($user);
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function update(User $user, ChallengeHint $hint): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, ChallengeHint $hint): bool
    {
        return $this->isStaff($user);
    }
}
