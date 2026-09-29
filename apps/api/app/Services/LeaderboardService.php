<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class LeaderboardService
{
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        $perPage = max(1, min($perPage, (int) config('ctf.leaderboard.max_page_size', 100)));

        return User::query()
            ->leaderboardEligible()
            ->withCount('userAchievements as achievements_count')
            ->orderByDesc('xp')
            ->orderByDesc('solved_count')
            ->orderBy('id')
            ->paginate($perPage);
    }

    /**
     * Dense rank matching ORDER BY xp DESC, solved_count DESC, id ASC.
     */
    public function rankFor(User $user): ?int
    {
        if ($user->banned_at !== null || $user->trashed()) {
            return null;
        }

        $rank = DB::table('users')
            ->whereNull('deleted_at')
            ->whereNull('banned_at')
            ->where(function ($q) use ($user): void {
                $q->where('xp', '>', $user->xp)
                    ->orWhere(function ($q2) use ($user): void {
                        $q2->where('xp', $user->xp)
                            ->where('solved_count', '>', $user->solved_count);
                    })
                    ->orWhere(function ($q3) use ($user): void {
                        $q3->where('xp', $user->xp)
                            ->where('solved_count', $user->solved_count)
                            ->where('id', '<', $user->id);
                    });
            })
            ->count();

        return $rank + 1;
    }
}
