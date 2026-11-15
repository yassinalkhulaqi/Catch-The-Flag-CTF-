<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\UpsertAchievementAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AchievementRequest;
use App\Http\Resources\Admin\AdminAchievementResource;
use App\Models\Achievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Staff achievement badge management. Learner-facing payloads never
 * include authoring fields (docs/content-authoring.md).
 */
class AchievementController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AdminAchievementResource::collection(
            Achievement::query()
                ->withCount('awards as awarded_count')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
        );
    }

    public function store(AchievementRequest $request, UpsertAchievementAction $action): JsonResponse
    {
        $achievement = $action->execute($request->user(), null, $request->validated(), $request);

        return response()->json(['data' => $this->present($achievement)], 201);
    }

    public function show(Achievement $achievement): AdminAchievementResource
    {
        return $this->present($achievement);
    }

    public function update(AchievementRequest $request, Achievement $achievement, UpsertAchievementAction $action): AdminAchievementResource
    {
        return $this->present($action->execute($request->user(), $achievement, $request->validated(), $request));
    }

    public function destroy(Request $request, Achievement $achievement, DeleteModelAction $action): JsonResponse
    {
        $action->execute($request->user(), $achievement, $request, 'achievement.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function present(Achievement $achievement): AdminAchievementResource
    {
        $achievement->loadCount('awards as awarded_count');

        return new AdminAchievementResource($achievement);
    }
}
