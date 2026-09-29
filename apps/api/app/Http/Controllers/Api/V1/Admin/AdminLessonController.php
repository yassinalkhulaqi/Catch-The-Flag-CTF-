<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLessonRequest;
use App\Http\Resources\LessonResource;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\PathModule;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminLessonController extends Controller
{
    public function store(StoreLessonRequest $request, PathModule $module, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $module);
        $lesson = $module->lessons()->create($request->validated());
        $audit->log($request->user(), 'lesson.create', $lesson, $request->validated());

        return response()->json(['data' => new LessonResource($lesson)], 201);
    }

    public function update(StoreLessonRequest $request, Lesson $lesson, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $lesson);
        $lesson->fill($request->validated())->save();
        $audit->log($request->user(), 'lesson.update', $lesson, $request->validated());

        return response()->json(['data' => new LessonResource($lesson)]);
    }

    public function destroy(Request $request, Lesson $lesson, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $lesson);
        $audit->log($request->user(), 'lesson.delete', $lesson, ['id' => $lesson->id]);
        $lesson->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function linkChallenge(Request $request, Lesson $lesson, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $lesson);
        $data = $request->validate(['challenge_id' => ['required', 'integer', 'exists:challenges,id']]);
        $lesson->challenges()->syncWithoutDetaching([$data['challenge_id']]);
        $audit->log($request->user(), 'lesson.link_challenge', $lesson, $data);

        return response()->json(['data' => ['ok' => true]]);
    }

    public function unlinkChallenge(Request $request, Lesson $lesson, Challenge $challenge, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $lesson);
        $lesson->challenges()->detach($challenge->id);
        $audit->log($request->user(), 'lesson.unlink_challenge', $lesson, ['challenge_id' => $challenge->id]);

        return response()->json(['data' => ['ok' => true]]);
    }
}
