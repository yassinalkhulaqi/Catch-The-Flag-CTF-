<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ContentStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\LessonCompletion;
use App\Models\Path;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Aggregate counts for the staff dashboard. Counts only — never ids, names or
 * emails. Authorization goes through the viewAdminDashboard gate (moderators
 * and admins may read it; the route group is middleware-only by design).
 */
class AdminStatsController extends Controller
{
    public function show(): JsonResponse
    {
        Gate::authorize('viewAdminDashboard');

        $challenge = static fn (ContentStatus $status): int => Challenge::where('status', $status->value)->count();
        $path = static fn (ContentStatus $status): int => Path::where('status', $status->value)->count();

        return response()->json(['data' => [
            'users' => User::count(),
            'users_banned' => User::whereNotNull('banned_at')->count(),
            'challenges_published' => $challenge(ContentStatus::Published),
            'challenges_draft' => $challenge(ContentStatus::Draft),
            'challenges_review' => $challenge(ContentStatus::Review),
            'challenges_archived' => $challenge(ContentStatus::Archived),
            'paths_published' => $path(ContentStatus::Published),
            'paths_draft' => $path(ContentStatus::Draft),
            'paths_review' => $path(ContentStatus::Review),
            'paths_archived' => $path(ContentStatus::Archived),
            'solves_total' => ChallengeSolve::count(),
            'lesson_completions' => LessonCompletion::count(),
        ]]);
    }
}
