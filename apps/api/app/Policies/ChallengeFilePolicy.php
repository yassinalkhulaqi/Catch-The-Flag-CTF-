<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ChallengeFile;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class ChallengeFilePolicy
{
    use ChecksRoles;

    public function download(User $user, ChallengeFile $file): bool
    {
        $file->loadMissing('challenge');

        if ($file->challenge === null) {
            return false;
        }

        if ($this->isStaff($user)) {
            return true;
        }

        return $this->published($file->challenge) && ! $user->isBanned();
    }

    public function manage(User $user, ChallengeFile $file): bool
    {
        return $this->isStaff($user);
    }

    public function create(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, ChallengeFile $file): bool
    {
        return $this->isStaff($user);
    }
}
