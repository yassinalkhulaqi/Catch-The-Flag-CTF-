<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\LinkLessonChallengeAction;
use App\Actions\Admin\UpsertLessonAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LessonRequest;
use App\Http\Requests\Admin\LinkChallengeRequest;
use App\Http\Resources\Admin\AdminLessonResource;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\PathModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff lesson management nested under modules, plus the
 * lessonâ†”challenge link endpoints.
 */
class LessonController extends Controller
{
    public function index(PathModule $module): JsonResponse
    {
        $lessons = $module->lessons()->orderBy('position')->orderBy('id')->get();

        return response()->json(['data' => AdminLessonResource::collection($lessons)]);
    }

    public function store(LessonRequest $request, PathModule $module, UpsertLessonAction $action): JsonResponse
    {
        $lesson = $action->execute($request->user(), $module, null, $request->validated(), $request);

        return response()->json(['data' => new AdminLessonResource($lesson)], 201);
    }

    public function show(Lesson $lesson): AdminLessonResource
    {
        $lesson->load(['challenges', 'quizzes']);
        $lesson->loadMissing('quizzes.questions.options');

        return new AdminLessonResource($lesson);
    }

    public function update(LessonRequest $request, Lesson $lesson, UpsertLessonAction $action): AdminLessonResource
    {
        return new AdminLessonResource($action->execute($request->user(), $lesson->module, $lesson, $request->validated(), $request));
    }

    public function destroy(Request $request, Lesson $lesson, DeleteModelAction $action): JsonResponse
    {
        $action->execute($request->user(), $lesson, $request, 'lesson.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function linkedChallenges(Lesson $lesson): JsonResponse
    {
        $challenges = $lesson->challenges()->orderBy('challenges.id')->get()
            ->map(fn (Challenge $challenge): array => [
                'id' => $challenge->id,
                'title' => $challenge->title,
                'slug' => $challenge->slug,
                'status' => $challenge->status->value,
            ])->values()->all();

        return response()->json(['data' => $challenges]);
    }

    public function linkChallenge(
        LinkChallengeRequest $request,
        Lesson $lesson,
        LinkLessonChallengeAction $action,
    ): JsonResponse {
        $challenge = Challenge::findOrFail((int) $request->validated()['challenge_id']);

        $action->execute($request->user(), $lesson, $challenge, $request);

        return response()->json(['data' => ['linked' => true]], 201);
    }

    public function unlinkChallenge(
        Request $request,
        Lesson $lesson,
        Challenge $challenge,
        LinkLessonChallengeAction $action,
    ): JsonResponse {
        $action->detach($request->user(), $lesson, $challenge, $request);

        return response()->json(['data' => ['linked' => false]]);
    }
}
