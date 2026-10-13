<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LessonSummaryResource;
use App\Models\PathModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Module detail with ordered published lessons.
 */
class ModuleController extends Controller
{
    public function show(int $module): JsonResponse
    {
        $model = PathModule::query()->with(['path', 'lessons'])->findOrFail($module);

        Gate::authorize('view', $model);

        $lessons = $model->lessons->where('is_published', true)->sortBy([['position', 'asc'], ['id', 'asc']])->values();

        return response()->json(['data' => [
            'id' => $model->id,
            'path_id' => $model->path_id,
            'title' => $model->title,
            'description' => $model->description,
            'position' => (int) $model->position,
            'lessons' => LessonSummaryResource::collection($lessons),
        ]]);
    }
}
