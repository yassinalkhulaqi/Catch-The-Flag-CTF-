<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Challenge;
use App\Models\ChallengeHint;
use App\Models\ChallengeSolve;
use App\Models\HintUnlock;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class UnlockHintAction
{
    /**
     * @return array{hint:ChallengeHint,unlocked:bool,points_remaining:int}
     */
    public function handle(User $user, Challenge $challenge, ChallengeHint $hint): array
    {
        if ($hint->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Hint not found.');
        }

        return DB::transaction(function () use ($user, $challenge, $hint): array {
            $unlock = HintUnlock::query()->firstOrCreate(
                ['user_id' => $user->id, 'hint_id' => $hint->id],
                [
                    'challenge_id' => $challenge->id,
                    'points_cost' => $hint->cost_points,
                    'created_at' => now(),
                ],
            );

            $hintCost = (int) HintUnlock::query()
                ->where('user_id', $user->id)
                ->where('challenge_id', $challenge->id)
                ->sum('points_cost');

            $solved = ChallengeSolve::query()
                ->where('user_id', $user->id)
                ->where('challenge_id', $challenge->id)
                ->exists();

            $pointsRemaining = $solved ? 0 : max(0, (int) $challenge->points - $hintCost);

            return [
                'hint' => $hint,
                'unlocked' => true,
                'points_remaining' => $pointsRemaining,
                'was_already_unlocked' => ! $unlock->wasRecentlyCreated,
            ];
        });
    }
}
