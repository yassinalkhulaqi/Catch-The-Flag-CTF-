<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AchievementCriteriaType;
use App\Enums\PathProgressStatus;
use App\Enums\XpReason;
use App\Models\Achievement;
use App\Models\ChallengeSolve;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserPathProgress;
use Illuminate\Support\Facades\DB;

final class AchievementService
{
    public function __construct(private XpService $xp) {}

    /**
     * @return list<UserAchievement>
     */
    public function evaluate(User $user): array
    {
        $awarded = [];
        $achievements = Achievement::query()->active()->orderBy('sort_order')->get();
        $owned = UserAchievement::query()
            ->where('user_id', $user->id)
            ->pluck('achievement_id')
            ->all();

        foreach ($achievements as $achievement) {
            if (in_array($achievement->id, $owned, true)) {
                continue;
            }

            if ($this->meets($user, $achievement)) {
                $row = $this->award($user, $achievement);
                if ($row !== null) {
                    $awarded[] = $row;
                }
            }
        }

        return $awarded;
    }

    public function progressToward(User $user, Achievement $achievement): array
    {
        $criteria = $achievement->criteria ?? [];
        $type = AchievementCriteriaType::tryFrom((string) ($criteria['type'] ?? ''));
        $threshold = (int) ($criteria['threshold'] ?? $criteria['count'] ?? 1);
        $current = match ($type) {
            AchievementCriteriaType::SolvesTotal => (int) $user->solved_count,
            AchievementCriteriaType::XpTotal => (int) $user->xp,
            AchievementCriteriaType::PathsCompleted => UserPathProgress::query()
                ->where('user_id', $user->id)
                ->where('status', PathProgressStatus::Completed)
                ->count(),
            AchievementCriteriaType::CategorySolves => ChallengeSolve::query()
                ->where('user_id', $user->id)
                ->whereHas('challenge', fn ($q) => $q->where('category_id', (int) ($criteria['category_id'] ?? 0)))
                ->count(),
            AchievementCriteriaType::FirstBlood => ChallengeSolve::query()
                ->where('user_id', $user->id)
                ->whereRaw('solved_at = (select min(s2.solved_at) from challenge_solves s2 where s2.challenge_id = challenge_solves.challenge_id)')
                ->count(),
            default => 0,
        };

        return ['current' => $current, 'target' => max(1, $threshold)];
    }

    private function meets(User $user, Achievement $achievement): bool
    {
        $progress = $this->progressToward($user, $achievement);

        return $progress['current'] >= $progress['target'];
    }

    private function award(User $user, Achievement $achievement): ?UserAchievement
    {
        return DB::transaction(function () use ($user, $achievement): ?UserAchievement {
            $existing = UserAchievement::query()
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->first();

            if ($existing !== null) {
                return null;
            }

            $row = UserAchievement::query()->create([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
                'awarded_at' => now(),
                'created_at' => now(),
            ]);

            $points = (int) ($achievement->points ?: config('ctf.xp.achievement', 50));
            if ($points > 0) {
                $this->xp->award($user, $points, XpReason::Achievement, $achievement);
            }

            return $row;
        });
    }
}
