<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\CompleteLessonAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\LessonResource;
use App\Models\ChallengeSolve;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LessonController extends Controller
{
    public function show(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorize('view', $lesson);
        $user = $request->user();
        $lesson->load(['challenges.category', 'challenges.tags', 'quiz']);

        $lesson->completed = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->exists();

        $solvedIds = ChallengeSolve::query()
            ->where('user_id', $user->id)
            ->whereIn('challenge_id', $lesson->challenges->pluck('id'))
            ->pluck('challenge_id')
            ->all();

        foreach ($lesson->challenges as $challenge) {
            $challenge->solved = in_array($challenge->id, $solvedIds, true);
        }

        $lesson->quiz_passed = false;
        if ($lesson->quiz) {
            $lesson->quiz_passed = QuizAttempt::query()
                ->where('user_id', $user->id)
                ->where('quiz_id', $lesson->quiz->id)
                ->where('passed', true)
                ->exists();
        }

        $siblings = Lesson::query()
            ->where('module_id', $lesson->module_id)
            ->published()
            ->orderBy('position')
            ->orderBy('id')
            ->pluck('id');
        $idx = $siblings->search($lesson->id);
        $lesson->prev_lesson_id = $idx !== false && $idx > 0 ? $siblings[$idx - 1] : null;
        $lesson->next_lesson_id = $idx !== false && $idx < $siblings->count() - 1 ? $siblings[$idx + 1] : null;

        return response()->json(['data' => new LessonResource($lesson)]);
    }

    public function complete(Request $request, Lesson $lesson, CompleteLessonAction $action): JsonResponse
    {
        $this->authorize('complete', $lesson);
        $completion = $action->handle($request->user(), $lesson);

        return response()->json(['data' => [
            'lesson_id' => $lesson->id,
            'completed_at' => optional($completion->completed_at)?->toIso8601String(),
            'xp' => (int) $request->user()->fresh()->xp,
        ]]);
    }
}
