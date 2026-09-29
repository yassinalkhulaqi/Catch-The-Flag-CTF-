<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AchievementResource;
use App\Models\Achievement;
use App\Models\UserAchievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AchievementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $owned = UserAchievement::query()
            ->where('user_id', $request->user()->id)
            ->get()
            ->keyBy('achievement_id');

        $items = Achievement::query()->active()->orderBy('sort_order')->get()->map(function (Achievement $a) use ($owned) {
            $row = $owned->get($a->id);
            $a->awarded = $row !== null;
            $a->awarded_at = $row?->awarded_at?->toIso8601String();

            return $a;
        });

        return response()->json(['data' => AchievementResource::collection($items)]);
    }
}
