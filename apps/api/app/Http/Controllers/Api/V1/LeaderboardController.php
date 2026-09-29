<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeaderboardEntryResource;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LeaderboardController extends Controller
{
    public function index(Request $request, LeaderboardService $leaderboard): JsonResponse
    {
        $perPage = min((int) $request->integer('per_page', config('ctf.leaderboard.page_size', 20)), 100);
        $page = max(1, (int) $request->integer('page', 1));
        $paginator = $leaderboard->paginate($perPage);
        $baseRank = ($paginator->currentPage() - 1) * $paginator->perPage();

        $entries = $paginator->getCollection()->values()->map(function ($user, $index) use ($baseRank) {
            $user->rank = $baseRank + $index + 1;

            return $user;
        });

        return response()->json([
            'data' => LeaderboardEntryResource::collection($entries),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'links' => [
                'next' => $paginator->nextPageUrl(),
                'prev' => $paginator->previousPageUrl(),
            ],
        ]);
    }

    public function me(Request $request, LeaderboardService $leaderboard): JsonResponse
    {
        $user = $request->user();
        $rank = $leaderboard->rankFor($user);
        $user->loadCount('userAchievements as achievements_count');
        $user->rank = $rank ?? 0;

        return response()->json(['data' => new LeaderboardEntryResource($user)]);
    }
}
