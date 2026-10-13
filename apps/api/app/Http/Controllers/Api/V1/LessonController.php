<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\CompleteLessonAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\LessonDetailResource;
use App\Models\ChallengeSolve;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Lesson reader + explicit completion (docs/database.md §8).
 */
class LessonController extends Controller
{
    public function show(Request $request, int $lesson): JsonResponse
    {
        $model = Lesson::query()->with(['module.path', 'challenges'])->findOrFail($lesson);

        Gate::authorize('view', $model);

        $user = $request->user();
        $viewerId = (int) $user->id;

        $siblings = Lesson::query()
            ->where('module_id', $model->module_id)
            ->where('is_published', true)
            ->orderBy('position')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $position = array_search($model->id, $siblings, true);

        $quiz = $model->quizzes()->where('is_published', true)->orderBy('position')->orderBy('id')->first();

        $quizStub = null;
        if ($quiz !== null) {
            $passed = QuizAttempt::query()
                ->where('user_id', $viewerId)
                ->where('quiz_id', $quiz->id)
                ->where('passed', true)
                ->exists();

            $quizStub = ['id' => $quiz->id, 'title' => $quiz->title, 'passed' => $passed];
        }

        $solvedIds = ChallengeSolve::query()
            ->where('user_id', $viewerId)
            ->whereIn('challenge_id', $model->challenges->pluck('id'))
            ->pluck('challenge_id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        $refs = $model->challenges->map(fn ($challenge): array => [
            'id' => $challenge->id,
            'title' => $challenge->title,
            'slug' => $challenge->slug,
            'points' => (int) $challenge->points,
            'difficulty' => $challenge->difficulty->value,
            'solved' => in_array($challenge->id, $solvedIds, true),
        ])->values()->all();

        $completed = LessonCompletion::query()
            ->where('user_id', $viewerId)
            ->where('lesson_id', $model->id)
            ->exists();

        return response()->json(['data' => new LessonDetailResource(
            $model,
            $quizStub,
            $refs,
            $position > 0 ? $siblings[$position - 1] : null,
            $position !== false && $position < count($siblings) - 1 ? $siblings[$position + 1] : null,
            $completed,
        )]);
    }

    public function complete(Request $request, int $lesson, CompleteLessonAction $action): JsonResponse
    {
        $model = Lesson::query()->findOrFail($lesson);

        Gate::authorize('view', $model);

        return response()->json(['data' => $action->execute($request->user(), $model)]);
    }
}
