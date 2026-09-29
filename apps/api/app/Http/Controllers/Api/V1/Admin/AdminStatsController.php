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

final class AdminStatsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => [
            'users' => User::query()->count(),
            'challenges_published' => Challenge::query()->where('status', ContentStatus::Published)->count(),
            'paths_published' => Path::query()->where('status', ContentStatus::Published)->count(),
            'solves_total' => ChallengeSolve::query()->count(),
        ]]);
    }
}
