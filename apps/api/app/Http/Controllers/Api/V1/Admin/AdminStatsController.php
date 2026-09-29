<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\Path;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminStatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Defense in depth: role middleware + explicit Gate (see AppServiceProvider).
        $this->authorize('viewAdminDashboard');

        return response()->json(['data' => [
            'users' => User::query()->count(),
            'challenges_published' => Challenge::query()->where('status', ContentStatus::Published)->count(),
            'paths_published' => Path::query()->where('status', ContentStatus::Published)->count(),
            'solves_total' => ChallengeSolve::query()->count(),
            'challenges_draft' => Challenge::query()->where('status', ContentStatus::Draft)->count(),
            'paths_draft' => Path::query()->where('status', ContentStatus::Draft)->count(),
            'users_banned' => User::query()->whereNotNull('banned_at')->count(),
        ]]);
    }
}
