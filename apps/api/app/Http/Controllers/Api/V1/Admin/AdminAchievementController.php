<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAchievementRequest;
use App\Http\Resources\AchievementResource;
use App\Models\Achievement;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminAchievementController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Achievement::class);

        return response()->json(['data' => AchievementResource::collection(
            Achievement::query()->orderBy('sort_order')->get()->each(fn ($a) => $a->awarded = false)
        )]);
    }

    public function store(StoreAchievementRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Achievement::class);
        $achievement = Achievement::query()->create($request->validated());
        $audit->log($request->user(), 'achievement.create', $achievement, $request->validated());
        $achievement->awarded = false;

        return response()->json(['data' => new AchievementResource($achievement)], 201);
    }

    public function show(Achievement $achievement): JsonResponse
    {
        $this->authorize('view', $achievement);
        $achievement->awarded = false;

        return response()->json(['data' => new AchievementResource($achievement)]);
    }

    public function update(Request $request, Achievement $achievement, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $achievement);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'string', 'max:400'],
            'icon' => ['nullable', 'string', 'max:60'],
            'criteria' => ['sometimes', 'array'],
            'points' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]);
        $achievement->fill($data)->save();
        $audit->log($request->user(), 'achievement.update', $achievement, $data);
        $achievement->awarded = false;

        return response()->json(['data' => new AchievementResource($achievement)]);
    }

    public function destroy(Request $request, Achievement $achievement, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $achievement);
        $audit->log($request->user(), 'achievement.delete', $achievement, ['id' => $achievement->id]);
        $achievement->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
