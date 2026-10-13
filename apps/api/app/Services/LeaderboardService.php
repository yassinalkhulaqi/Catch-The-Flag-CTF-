<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Deterministic global ranking: xp DESC, solved_count DESC, id ASC
 * (docs/architecture.md §8.3). Suspended and deleted accounts never rank.
 */
class LeaderboardService
{
    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function page(int $page, int $perPage): LengthAwarePaginator
    {
        $perPage = min(max($perPage, 1), (int) config('ctf.leaderboard.max_page_size'));

        return $this->rankedQuery()->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * 1-based rank of the user within the same deterministic ordering,
     * or null when the user does not rank (banned).
     */
    public function rankFor(User $user): ?int
    {
        if ($user->isBanned()) {
            return null;
        }

        $ahead = $this->rankedQuery()
            ->where(function ($query) use ($user): void {
                $query->where('xp', '>', $user->xp)
                    ->orWhere(function ($query) use ($user): void {
                        $query->where('xp', $user->xp)
                            ->where('solved_count', '>', $user->solved_count);
                    })
                    ->orWhere(function ($query) use ($user): void {
                        $query->where('xp', $user->xp)
                            ->where('solved_count', $user->solved_count)
                            ->where('id', '<', $user->id);
                    });
            })
            ->count();

        return $ahead + 1;
    }

    /**
     * @return Builder<User>
     */
    private function rankedQuery(): Builder
    {
        return User::query()
            ->whereNull('banned_at')
            ->orderByDesc('xp')
            ->orderByDesc('solved_count')
            ->orderBy('id');
    }

    /**
     * Rank of the first row on a paginator page (for entry numbering).
     */
    public function rankOffset(LengthAwarePaginator $paginator): int
    {
        return (int) (($paginator->currentPage() - 1) * $paginator->perPage());
    }
}
