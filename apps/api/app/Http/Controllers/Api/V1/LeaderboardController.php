<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeaderboardIndexRequest;
use App\Http\Resources\LeaderboardEntryResource;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public deterministic ranking + the caller's own rank.
 */
class LeaderboardController extends Controller
{
    public function index(LeaderboardIndexRequest $request, LeaderboardService $board): JsonResponse
    {
        $validated = $request->validated();
        $page = (int) ($validated['page'] ?? 1);
        $perPage = (int) ($validated['per_page'] ?? config('ctf.leaderboard.page_size'));

        $paginator = $board->page($page, $perPage);
        $offset = $board->rankOffset($paginator);

        $entries = $paginator->getCollection()->values()->map(
            fn ($user, int $index): LeaderboardEntryResource => new LeaderboardEntryResource($user, $offset + $index + 1)
        );

        return response()->json([
            'data' => $entries,
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

    public function me(Request $request, LeaderboardService $board): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => [
            'user' => new LeaderboardEntryResource($user, $board->rankFor($user) ?? 0),
            'rank' => $board->rankFor($user),
        ]]);
    }
}
