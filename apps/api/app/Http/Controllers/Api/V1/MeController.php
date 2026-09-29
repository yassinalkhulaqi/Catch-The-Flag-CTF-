<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PathProgressStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AchievementResource;
use App\Http\Resources\SolveResource;
use App\Http\Resources\XpTransactionResource;
use App\Models\Achievement;
use App\Models\LessonCompletion;
use App\Models\UserAchievement;
use App\Models\UserPathProgress;
use App\Services\AchievementService;
use App\Services\LeaderboardService;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class MeController extends Controller
{
    public function progress(Request $request, ProgressService $progress, LeaderboardService $leaderboard): JsonResponse
    {
        $user = $request->user();
        $started = UserPathProgress::query()->where('user_id', $user->id)->count();
        $completed = UserPathProgress::query()
            ->where('user_id', $user->id)
            ->where('status', PathProgressStatus::Completed)
            ->count();

        return response()->json(['data' => [
            'paths_started' => $started,
            'paths_completed' => $completed,
            'lessons_completed' => LessonCompletion::query()->where('user_id', $user->id)->count(),
            'challenges_solved' => (int) $user->solved_count,
            'xp' => (int) $user->xp,
            'rank' => $leaderboard->rankFor($user),
            'streak_days' => 0,
        ]]);
    }

    public function solves(Request $request): JsonResponse
    {
        $solves = $request->user()->solves()
            ->with(['challenge.category', 'challenge.tags'])
            ->orderByDesc('solved_at')
            ->paginate(20);

        return response()->json([
            'data' => SolveResource::collection($solves->items()),
            'meta' => [
                'current_page' => $solves->currentPage(),
                'per_page' => $solves->perPage(),
                'total' => $solves->total(),
                'last_page' => $solves->lastPage(),
            ],
        ]);
    }

    public function xpLedger(Request $request): JsonResponse
    {
        $rows = $request->user()->xpTransactions()->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'data' => XpTransactionResource::collection($rows->items()),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
                'last_page' => $rows->lastPage(),
            ],
        ]);
    }

    public function achievements(Request $request, AchievementService $service): JsonResponse
    {
        $user = $request->user();
        $owned = UserAchievement::query()->where('user_id', $user->id)->get()->keyBy('achievement_id');
        $all = Achievement::query()->active()->orderBy('sort_order')->get();

        $data = $all->map(function (Achievement $a) use ($owned, $service, $user) {
            $row = $owned->get($a->id);
            $a->awarded = $row !== null;
            $a->awarded_at = $row?->awarded_at?->toIso8601String();
            if (! $a->awarded) {
                $a->progress = $service->progressToward($user, $a);
            }

            return $a;
        });

        return response()->json(['data' => AchievementResource::collection($data)]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()->paginate(20);

        return response()->json([
            'data' => $notifications->getCollection()->map(fn ($n) => [
                'id' => $n->id,
                'type' => class_basename($n->type),
                'data' => $n->data,
                'read_at' => optional($n->read_at)?->toIso8601String(),
                'created_at' => optional($n->created_at)?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'last_page' => $notifications->lastPage(),
            ],
        ]);
    }

    public function readNotification(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function readAllNotifications(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function settings(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'email' => $request->user()->email,
            'theme' => 'system',
        ]]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'theme' => ['sometimes', 'string', 'in:system,light,dark'],
        ]);

        return response()->json(['data' => [
            'email' => $request->user()->email,
            'theme' => $data['theme'] ?? 'system',
        ]]);
    }
}
