<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AchievementCriteriaType;
use App\Enums\PathProgressStatus;
use App\Enums\XpReason;
use App\Models\Achievement;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserPathProgress;
use App\Notifications\AchievementEarnedNotification;
use Illuminate\Support\Facades\DB;

/**
 * Criteria-driven achievement awards (docs/database.md §7).
 * Idempotent: UNIQUE(user_id, achievement_id) + first-check means
 * re-evaluation never double-awards. Awards carry the achievement
 * row's point value as bonus XP.
 */
class AchievementEvaluator
{
    public function __construct(private readonly XpAwarder $xp) {}

    /**
     * Evaluate every active achievement for the user. Pass the
     * just-solved challenge for first_blood evaluation.
     */
    public function evaluate(User $user, ?Challenge $justSolved = null): void
    {
        $earnedIds = UserAchievement::query()
            ->where('user_id', $user->id)
            ->pluck('achievement_id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        $achievements = Achievement::query()
            ->where('is_active', true)
            ->whereNotIn('id', $earnedIds)
            ->get();

        foreach ($achievements as $achievement) {
            if ($this->satisfied($user->refresh(), $achievement, $justSolved)) {
                $this->award($user->refresh(), $achievement);
            }
        }
    }

    private function satisfied(User $user, Achievement $achievement, ?Challenge $justSolved): bool
    {
        $criteria = $achievement->criteria ?? [];
        $type = AchievementCriteriaType::tryFrom((string) ($criteria['type'] ?? ''));

        if ($type === null) {
            return false;
        }

        $target = (int) ($criteria['target'] ?? 1);

        return match ($type) {
            AchievementCriteriaType::SolvesTotal => $user->solved_count >= $target,
            AchievementCriteriaType::XpTotal => $user->xp >= $target,
            AchievementCriteriaType::PathsCompleted => $this->pathsCompleted($user) >= $target,
            AchievementCriteriaType::CategorySolves => $this->categorySolves($user, (int) ($criteria['category_id'] ?? 0)) >= $target,
            AchievementCriteriaType::FirstBlood => $this->isFirstBlood($user, $justSolved),
        };
    }

    /**
     * Current progress toward an achievement for status display.
     * Null when the criterion has no meaningful counter.
     *
     * @return array{current: int, target: int}|null
     */
    public function progressFor(User $user, Achievement $achievement): ?array
    {
        $criteria = $achievement->criteria ?? [];
        $type = AchievementCriteriaType::tryFrom((string) ($criteria['type'] ?? ''));

        if ($type === null) {
            return null;
        }

        $target = max(1, (int) ($criteria['target'] ?? 1));

        $current = match ($type) {
            AchievementCriteriaType::SolvesTotal => $user->solved_count,
            AchievementCriteriaType::XpTotal => $user->xp,
            AchievementCriteriaType::PathsCompleted => $this->pathsCompleted($user),
            AchievementCriteriaType::CategorySolves => $this->categorySolves($user, (int) ($criteria['category_id'] ?? 0)),
            AchievementCriteriaType::FirstBlood => $this->firstBloodCount($user),
        };

        return ['current' => min((int) $current, $target), 'target' => $target];
    }

    /**
     * Number of challenges where the user holds the earliest solve.
     */
    private function firstBloodCount(User $user): int
    {
        $solveIds = ChallengeSolve::query()->where('user_id', $user->id)->pluck('id');

        if ($solveIds->isEmpty()) {
            return 0;
        }

        return (int) DB::table('challenge_solves as mine')
            ->whereIn('mine.id', $solveIds)
            ->whereNotExists(function ($query): void {
                $query->select(DB::raw(1))
                    ->from('challenge_solves as earlier')
                    ->whereColumn('earlier.challenge_id', 'mine.challenge_id')
                    ->where(function ($query): void {
                        $query->where('earlier.solved_at', '<', DB::raw('mine.solved_at'))
                            ->orWhere(function ($query): void {
                                $query->where('earlier.solved_at', DB::raw('mine.solved_at'))
                                    ->where('earlier.id', '<', DB::raw('mine.id'));
                            });
                    });
            })
            ->count();
    }

    private function award(User $user, Achievement $achievement): void
    {
        DB::transaction(function () use ($user, $achievement): void {
            $exists = UserAchievement::query()
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->exists();

            if ($exists) {
                return;
            }

            UserAchievement::forceCreate([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
                'awarded_at' => now(),
                'created_at' => now(),
            ]);

            if ($achievement->points > 0) {
                $this->xp->award(
                    $user,
                    (int) $achievement->points,
                    XpReason::Achievement,
                    Achievement::class,
                    $achievement->id,
                );
            }

            $user->notify(new AchievementEarnedNotification(
                $achievement->id,
                $achievement->title,
                $achievement->description,
            ));
        });
    }

    private function pathsCompleted(User $user): int
    {
        return UserPathProgress::query()
            ->where('user_id', $user->id)
            ->where('status', PathProgressStatus::Completed)
            ->count();
    }

    private function categorySolves(User $user, int $categoryId): int
    {
        if ($categoryId <= 0) {
            return 0;
        }

        return ChallengeSolve::query()
            ->where('challenge_solves.user_id', $user->id)
            ->join('challenges', 'challenges.id', '=', 'challenge_solves.challenge_id')
            ->where('challenges.category_id', $categoryId)
            ->count();
    }

    private function isFirstBlood(User $user, ?Challenge $challenge): bool
    {
        if ($challenge === null) {
            return false;
        }

        $first = ChallengeSolve::query()
            ->where('challenge_id', $challenge->id)
            ->orderBy('solved_at')
            ->orderBy('id')
            ->first();

        return $first !== null && (int) $first->user_id === (int) $user->id;
    }
}
