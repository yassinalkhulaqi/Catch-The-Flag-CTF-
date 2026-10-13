<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PathProgressStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AchievementStatusResource;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\SolveEntryResource;
use App\Http\Resources\XpEntryResource;
use App\Models\Achievement;
use App\Models\ChallengeSolve;
use App\Models\LessonCompletion;
use App\Models\UserAchievement;
use App\Models\UserPathProgress;
use App\Services\AchievementEvaluator;
use App\Services\LeaderboardService;
use App\Services\ProgressCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Authenticated "me" namespace: progress, solves, ledger, achievements,
 * notifications. Every query is scoped to the caller — there is no
 * user-id parameter anywhere in this controller (IDOR by construction).
 */
class MeController extends Controller
{
    public function progress(Request $request, ProgressCalculator $calculator, LeaderboardService $board): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => [
            'paths_started' => UserPathProgress::query()->where('user_id', $user->id)->count(),
            'paths_completed' => UserPathProgress::query()
                ->where('user_id', $user->id)
                ->where('status', PathProgressStatus::Completed)
                ->count(),
            'lessons_completed' => LessonCompletion::query()->where('user_id', $user->id)->count(),
            'challenges_solved' => ChallengeSolve::query()->where('user_id', $user->id)->count(),
            'xp' => (int) $user->xp,
            'rank' => $board->rankFor($user),
            'streak_days' => $calculator->streakDays($user),
        ]]);
    }

    public function solves(Request $request): JsonResponse
    {
        $solves = ChallengeSolve::query()
            ->with('challenge.category')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('solved_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json([
            'data' => SolveEntryResource::collection($solves),
            'meta' => [
                'current_page' => $solves->currentPage(),
                'per_page' => $solves->perPage(),
                'total' => $solves->total(),
                'last_page' => $solves->lastPage(),
            ],
            'links' => ['next' => $solves->nextPageUrl(), 'prev' => $solves->previousPageUrl()],
        ]);
    }

    public function xpLedger(Request $request): JsonResponse
    {
        $entries = $request->user()->xpTransactions()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json([
            'data' => XpEntryResource::collection($entries),
            'meta' => [
                'current_page' => $entries->currentPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
                'last_page' => $entries->lastPage(),
            ],
            'links' => ['next' => $entries->nextPageUrl(), 'prev' => $entries->previousPageUrl()],
        ]);
    }

    public function achievements(Request $request, AchievementEvaluator $evaluator): JsonResponse
    {
        $user = $request->user();

        $awarded = UserAchievement::query()
            ->where('user_id', $user->id)
            ->pluck('awarded_at', 'achievement_id');

        $all = Achievement::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $data = $all->map(function ($achievement) use ($awarded, $evaluator, $user): AchievementStatusResource {
            $at = $awarded->get($achievement->id);

            return new AchievementStatusResource(
                $achievement,
                $at !== null,
                $at !== null ? $at->toISOString() : null,
                $at !== null ? null : $evaluator->progressFor($user, $achievement),
            );
        });

        return response()->json(['data' => $data]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $notes = $request->user()->notifications()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'data' => NotificationResource::collection($notes),
            'meta' => [
                'current_page' => $notes->currentPage(),
                'per_page' => $notes->perPage(),
                'total' => $notes->total(),
                'last_page' => $notes->lastPage(),
            ],
            'links' => ['next' => $notes->nextPageUrl(), 'prev' => $notes->previousPageUrl()],
        ]);
    }

    public function readNotification(Request $request, string $id): JsonResponse
    {
        $note = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $note->markAsRead();

        return response()->json(['data' => new NotificationResource($note->refresh())]);
    }

    public function readAllNotifications(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['data' => ['read' => true]]);
    }
}
