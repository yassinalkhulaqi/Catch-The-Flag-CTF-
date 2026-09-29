<?php

declare(strict_types=1);

namespace App\Services\FlagValidators;

use App\Models\Challenge;
use App\Models\ChallengeFlag;
use App\Models\User;
use App\Services\FlagCryptoService;

final class StaticFlagValidator implements FlagValidator
{
    public function __construct(private FlagCryptoService $crypto) {}

    public function validate(Challenge $challenge, User $user, string $submittedFlag): bool
    {
        $flags = $challenge->flags()->active()->get();

        foreach ($flags as $flag) {
            /** @var ChallengeFlag $flag */
            if ($this->crypto->verify($submittedFlag, $flag->flag_hash, $flag->case_sensitive)) {
                return true;
            }
        }

        return false;
    }
}
