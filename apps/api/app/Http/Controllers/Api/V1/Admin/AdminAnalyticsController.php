<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Staff analytics (docs/product.md §7). Read-only aggregates over the
 * source-of-truth tables; gated by `viewAdminDashboard`.
 */
class AdminAnalyticsController extends Controller
{
    public function summary(AdminAnalyticsService $analytics): JsonResponse
    {
        Gate::authorize('viewAdminDashboard');

        return response()->json(['data' => $analytics->summary()]);
    }

    public function categories(AdminAnalyticsService $analytics): JsonResponse
    {
        Gate::authorize('viewAdminDashboard');

        return response()->json(['data' => $analytics->perCategory()]);
    }

    public function xp(Request $request, AdminAnalyticsService $analytics): JsonResponse
    {
        Gate::authorize('viewAdminDashboard');

        $validated = $request->validate([
            'days' => ['sometimes', 'integer', 'min:7', 'max:90'],
        ]);

        $days = (int) ($validated['days'] ?? 30);

        return response()->json(['data' => [
            'days' => $days,
            'series' => $analytics->xpSeries($days),
        ]]);
    }
}
