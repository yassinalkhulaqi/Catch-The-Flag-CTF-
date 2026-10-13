<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Challenge;
use App\Models\ChallengeHint;
use App\Models\HintUnlock;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Idempotent hint reveal: unlocking twice changes nothing, and the
 * point cost is snapshotted on the unlock row so later cost edits
 * never rewrite history.
 *
 * @return array{content: string, points_remaining: int, already_unlocked: bool}
 */
class UnlockHintAction
{
    /**
     * @return array{content: string, points_remaining: int, already_unlocked: bool}
     */
    public function execute(User $user, Challenge $challenge, ChallengeHint $hint): array
    {
        return DB::transaction(function () use ($user, $challenge, $hint): array {
            $unlock = HintUnlock::query()
                ->where('user_id', $user->id)
                ->where('hint_id', $hint->id)
                ->first();

            $already = $unlock !== null;

            if (! $already) {
                $unlock = HintUnlock::forceCreate([
                    'user_id' => $user->id,
                    'challenge_id' => $challenge->id,
                    'hint_id' => $hint->id,
                    'points_cost' => $hint->cost_points,
                    'created_at' => now(),
                ]);
            }

            $spent = (int) HintUnlock::query()
                ->where('user_id', $user->id)
                ->where('challenge_id', $challenge->id)
                ->sum('points_cost');

            return [
                'content' => (string) $hint->content,
                'points_remaining' => max(0, $challenge->points - $spent),
                'already_unlocked' => $already,
            ];
        });
    }
}
