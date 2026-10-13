<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\FlagValidationType;
use App\Enums\XpReason;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\ChallengeSubmission;
use App\Models\HintUnlock;
use App\Models\User;
use App\Models\XpTransaction;
use App\Services\AchievementEvaluator;
use App\Services\FlagValidator;
use App\Services\ProgressCalculator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Flag submission pipeline (docs/architecture.md §7).
 *
 * Everything is derived server-side inside one transaction: the client
 * sends intent ({flag}) and receives an outcome, never XP or points.
 * Submitted values are stored as HMAC only — never plaintext.
 *
 * @return array{result: string, points_awarded?: int, already_solved?: bool, xp_total?: int}
 */
class SubmitFlagAction
{
    public function __construct(
        private readonly AchievementEvaluator $achievements,
        private readonly ProgressCalculator $progress,
    ) {}

    /**
     * @return array{result: string, points_awarded?: int, already_solved?: bool, xp_total?: int}
     */
    public function execute(User $user, Challenge $challenge, string $flag, string $ip, ?string $userAgent): array
    {
        if ($challenge->flag_validation_type !== FlagValidationType::Static) {
            throw new HttpException(400, 'This challenge type is not supported yet.');
        }

        $matched = FlagValidator::check($flag, $challenge);

        return DB::transaction(function () use ($user, $challenge, $flag, $ip, $userAgent, $matched): array {
            ChallengeSubmission::forceCreate([
                'challenge_id' => $challenge->id,
                'user_id' => $user->id,
                'flag_hash' => FlagValidator::hash(trim($flag)),
                'is_correct' => $matched !== null,
                'ip_address' => $ip,
                'user_agent' => $userAgent !== null ? substr($userAgent, 0, 255) : null,
                'created_at' => now(),
            ]);

            if ($matched === null) {
                return ['result' => 'incorrect'];
            }

            $points = max(1, $challenge->points - $this->unlockCost($user->id, $challenge->id));
            $hintsUsed = $this->unlockCount($user->id, $challenge->id);

            try {
                // Nested transaction = SAVEPOINT: a lost insert race rolls
                // back to the savepoint instead of aborting the outer
                // transaction (PostgreSQL aborts on any in-txn error).
                DB::transaction(function () use ($user, $challenge, $points, $hintsUsed): void {
                    ChallengeSolve::forceCreate([
                        'challenge_id' => $challenge->id,
                        'user_id' => $user->id,
                        'points_awarded' => $points,
                        'hints_used' => $hintsUsed,
                        'solved_at' => now(),
                        'created_at' => now(),
                    ]);
                });
            } catch (QueryException $e) {
                // UNIQUE(challenge_id, user_id) lost the race or a solve
                // already exists: duplicates award nothing. Any other
                // database error must surface, never masquerade as a solve.
                if (! $this->isUniqueViolation($e)) {
                    throw $e;
                }

                return ['result' => 'correct', 'points_awarded' => 0, 'already_solved' => true];
            }

            XpTransaction::create([
                'user_id' => $user->id,
                'amount' => $points,
                'reason' => XpReason::ChallengeSolve,
                'reference_type' => Challenge::class,
                'reference_id' => $challenge->id,
            ]);

            $user->increment('xp', $points);
            $user->increment('solved_count');
            $challenge->increment('solve_count');

            $fresh = $user->refresh();
            $this->achievements->evaluate($fresh, $challenge);
            $this->progress->recomputeForUser($fresh);

            return [
                'result' => 'correct',
                'points_awarded' => $points,
                'xp_total' => (int) $fresh->refresh()->xp,
            ];
        });
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        $code = $e->getCode();

        if ($code === '23505' || $code === 23000) {
            return true;
        }

        $previous = $e->getPrevious();

        return $previous !== null && (string) $previous->getCode() === '23505';
    }

    private function unlockCost(int $userId, int $challengeId): int
    {
        return (int) HintUnlock::query()
            ->where('user_id', $userId)
            ->where('challenge_id', $challengeId)
            ->sum('points_cost');
    }

    private function unlockCount(int $userId, int $challengeId): int
    {
        return (int) HintUnlock::query()
            ->where('user_id', $userId)
            ->where('challenge_id', $challengeId)
            ->count();
    }
}
