<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAchievementRequest;
use App\Http\Requests\Admin\UpdateAchievementRequest;
use App\Http\Resources\AdminAchievementResource;
use App\Models\Achievement;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminAchievementController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Achievement::class);

        $items = Achievement::query()
            ->withCount('userAchievements as awarded_count')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => AdminAchievementResource::collection($items),
        ]);
    }

    public function store(StoreAchievementRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Achievement::class);
        $achievement = Achievement::query()->create($request->validated());
        $audit->log($request->user(), 'achievement.create', $achievement, $request->validated());

        return response()->json(['data' => $this->present($achievement)], 201);
    }

    public function show(Achievement $achievement): JsonResponse
    {
        $this->authorize('view', $achievement);

        return response()->json(['data' => $this->present($achievement)]);
    }

    public function update(UpdateAchievementRequest $request, Achievement $achievement, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $achievement);
        $data = $request->validated();
        $achievement->fill($data)->save();
        $audit->log($request->user(), 'achievement.update', $achievement, $data);

        return response()->json(['data' => $this->present($achievement)]);
    }

    public function destroy(Request $request, Achievement $achievement, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $achievement);
        $audit->log($request->user(), 'achievement.delete', $achievement, [
            'id' => $achievement->id,
            'key' => $achievement->key,
        ]);
        $achievement->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    private function present(Achievement $achievement): AdminAchievementResource
    {
        $achievement->loadCount('userAchievements as awarded_count');

        return new AdminAchievementResource($achievement);
    }
}
