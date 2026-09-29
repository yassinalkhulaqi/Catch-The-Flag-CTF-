<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ModuleResource;
use App\Models\LessonCompletion;
use App\Models\PathModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ModuleController extends Controller
{
    public function show(Request $request, PathModule $module): JsonResponse
    {
        $this->authorize('view', $module);
        $module->load(['lessons' => fn ($q) => $q->published()]);

        $completedIds = LessonCompletion::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('lesson_id', $module->lessons->pluck('id'))
            ->pluck('lesson_id')
            ->all();

        foreach ($module->lessons as $lesson) {
            $lesson->completed = in_array($lesson->id, $completedIds, true);
        }

        return response()->json(['data' => new ModuleResource($module)]);
    }
}
