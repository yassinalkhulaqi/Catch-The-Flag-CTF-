<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ContentStatus;
use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\ChallengeSubmission;
use App\Models\User;
use App\Models\XpTransaction;

/**
 * Read-only aggregates for the staff analytics surface
 * (docs/roadmap.md, V1.5 / docs/product.md §7).
 *
 * Every number is a direct query over the source-of-truth tables — never an
 * incremented counter or a cached denormalized figure — and every query is
 * parameterised.
 */
final class AdminAnalyticsService
{
    /**
     * @return array{
     *     users: int,
     *     xp_total: int,
     *     solves_total: int,
     *     submissions_total: int,
     *     challenges_published: int,
     *     solve_rate: float,
     *     registrations_30d: int,
     *     active_learners_30d: int,
     * }
     */
    public function summary(): array
    {
        $attempts = ChallengeSubmission::count();

        return [
            'users' => User::count(),
            'xp_total' => (int) XpTransaction::sum('amount'),
            'solves_total' => ChallengeSolve::count(),
            'submissions_total' => $attempts,
            'challenges_published' => Challenge::where('status', ContentStatus::Published->value)->count(),
            'solve_rate' => $attempts > 0 ? round(ChallengeSolve::count() / $attempts * 100, 1) : 0.0,
            'registrations_30d' => User::where('created_at', '>=', now()->subDays(30))->count(),
            'active_learners_30d' => (int) XpTransaction::where('created_at', '>=', now()->subDays(30))
                ->distinct('user_id')
                ->count('user_id'),
        ];
    }

    /**
     * Per-category solve funnel: published challenges, attempt count, unique
     * solves and the attempt→solve rate. Rate is 0 when nothing was attempted.
     *
     * @return list<array{category: string, slug: string, published: int, attempts: int, solves: int, solve_rate: float}>
     */
    public function perCategory(): array
    {
        $challenges = Challenge::where('status', ContentStatus::Published->value)
            ->get(['id', 'category_id']);

        if ($challenges->isEmpty()) {
            return [];
        }

        $challengeIds = $challenges->pluck('id');

        $attempts = ChallengeSubmission::whereIn('challenge_id', $challengeIds)
            ->selectRaw('challenge_id, count(*) as total')
            ->groupBy('challenge_id')
            ->pluck('total', 'challenge_id');

        $solves = ChallengeSolve::whereIn('challenge_id', $challengeIds)
            ->selectRaw('challenge_id, count(*) as total')
            ->groupBy('challenge_id')
            ->pluck('total', 'challenge_id');

        $byCategory = $challenges->groupBy('category_id');

        $rows = [];

        foreach (Category::whereIn('id', $byCategory->keys())->get() as $category) {
            $ids = $byCategory[$category->id]->pluck('id');
            $attemptCount = (int) $ids->sum(fn (int $id): int => (int) ($attempts[$id] ?? 0));
            $solveCount = (int) $ids->sum(fn (int $id): int => (int) ($solves[$id] ?? 0));

            $rows[] = [
                'category' => $category->name,
                'slug' => $category->slug,
                'published' => $ids->count(),
                'attempts' => $attemptCount,
                'solves' => $solveCount,
                'solve_rate' => $attemptCount > 0 ? round($solveCount / $attemptCount * 100, 1) : 0.0,
            ];
        }

        usort($rows, static fn (array $a, array $b): int => $b['solves'] <=> $a['solves']);

        return $rows;
    }

    /**
     * XP awarded per calendar day for the trailing `$days` window, with
     * zero-filled gaps so the series is continuous.
     *
     * @return list<array{day: string, xp: int}>
     */
    public function xpSeries(int $days): array
    {
        $days = max(7, min(90, $days));
        $from = now()->subDays($days - 1)->startOfDay();

        $raw = XpTransaction::where('created_at', '>=', $from)
            ->selectRaw('date(created_at) as day, sum(amount) as xp')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->pluck('xp', 'day');

        $series = [];

        for ($i = 0; $i < $days; $i++) {
            $day = $from->copy()->addDays($i)->toDateString();
            $series[] = ['day' => $day, 'xp' => (int) ($raw[$day] ?? 0)];
        }

        return $series;
    }
}
