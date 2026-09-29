<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\XpReason;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\ChallengeSubmission;
use App\Models\HintUnlock;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\FlagCryptoService;
use App\Services\FlagValidators\FlagValidatorRegistry;
use App\Services\ProgressService;
use App\Services\XpService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

final class SubmitFlagAction
{
    public function __construct(
        private FlagCryptoService $crypto,
        private FlagValidatorRegistry $validators,
        private XpService $xp,
        private ProgressService $progress,
        private AchievementService $achievements,
    ) {}

    /**
     * @return array{result:string,points_awarded?:int,already_solved?:bool,xp_total?:int,hints_used?:int}
     */
    public function handle(User $user, Challenge $challenge, string $flag): array
    {
        $existingSolve = ChallengeSolve::query()
            ->where('user_id', $user->id)
            ->where('challenge_id', $challenge->id)
            ->first();

        if ($existingSolve !== null) {
            return [
                'result' => 'correct',
                'points_awarded' => $existingSolve->points_awarded,
                'already_solved' => true,
                'xp_total' => (int) $user->xp,
                'hints_used' => $existingSolve->hints_used,
            ];
        }

        $validator = $this->validators->get($challenge->flag_validation_type);
        $isCorrect = $validator->validate($challenge, $user, $flag);
        $submissionHash = $this->crypto->hmacHash($this->crypto->normalize($flag, true));

        Log::info('flag.submission', [
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'flag_hash_prefix' => $this->crypto->hashPrefixForLog($submissionHash),
            'is_correct' => $isCorrect,
        ]);

        return DB::transaction(function () use ($user, $challenge, $isCorrect, $submissionHash): array {
            ChallengeSubmission::query()->create([
                'challenge_id' => $challenge->id,
                'user_id' => $user->id,
                'flag_hash' => $submissionHash,
                'is_correct' => $isCorrect,
                'ip_address' => Request::ip(),
                'user_agent' => substr((string) Request::userAgent(), 0, 255) ?: null,
                'created_at' => now(),
            ]);

            if (! $isCorrect) {
                return ['result' => 'incorrect'];
            }

            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $lockedChallenge = Challenge::query()->whereKey($challenge->id)->lockForUpdate()->firstOrFail();

            $already = ChallengeSolve::query()
                ->where('user_id', $lockedUser->id)
                ->where('challenge_id', $lockedChallenge->id)
                ->first();

            if ($already !== null) {
                return [
                    'result' => 'correct',
                    'points_awarded' => $already->points_awarded,
                    'already_solved' => true,
                    'xp_total' => (int) $lockedUser->xp,
                    'hints_used' => $already->hints_used,
                ];
            }

            $hintsUsed = HintUnlock::query()
                ->where('user_id', $lockedUser->id)
                ->where('challenge_id', $lockedChallenge->id)
                ->count();

            $hintCost = (int) HintUnlock::query()
                ->where('user_id', $lockedUser->id)
                ->where('challenge_id', $lockedChallenge->id)
                ->sum('points_cost');

            $pointsAwarded = max(0, (int) $lockedChallenge->points - $hintCost);

            $solve = ChallengeSolve::query()->create([
                'challenge_id' => $lockedChallenge->id,
                'user_id' => $lockedUser->id,
                'points_awarded' => $pointsAwarded,
                'hints_used' => $hintsUsed,
                'solved_at' => now(),
                'created_at' => now(),
            ]);

            $lockedChallenge->forceFill([
                'solve_count' => (int) $lockedChallenge->solve_count + 1,
            ])->save();

            $lockedUser->forceFill([
                'solved_count' => (int) $lockedUser->solved_count + 1,
            ])->save();

            $this->xp->award($lockedUser, $pointsAwarded, XpReason::ChallengeSolve, $solve);

            $lockedChallenge->load('lessons.module.path');
            foreach ($lockedChallenge->lessons as $lesson) {
                if ($lesson->module?->path) {
                    $this->progress->startPath($lockedUser, $lesson->module->path);
                    $this->progress->recalculatePath($lockedUser, $lesson->module->path);
                }
            }

            $this->achievements->evaluate($lockedUser->fresh());

            $fresh = $lockedUser->fresh();

            return [
                'result' => 'correct',
                'points_awarded' => $pointsAwarded,
                'already_solved' => false,
                'xp_total' => (int) $fresh->xp,
                'hints_used' => $hintsUsed,
            ];
        });
    }
}
