<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\QuizAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuizAttemptResource;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Own-attempt endpoints. Cross-user access is 404 (no oracle).
 */
class QuizAttemptController extends Controller
{
    public function answer(Request $request, int $attempt, QuizAction $action): JsonResponse
    {
        $model = QuizAttempt::query()->with('quiz.questions.options')->findOrFail($attempt);

        $this->denyAsNotFound($model, 'answer');

        $validated = $request->validate([
            'question_id' => ['required', 'integer'],
            'selected_option_ids' => ['required', 'array', 'min:1'],
            'selected_option_ids.*' => ['integer'],
        ]);

        $result = $action->answer(
            $request->user(),
            $model,
            (int) $validated['question_id'],
            array_map(intval(...), $validated['selected_option_ids']),
        );

        return response()->json(['data' => $result]);
    }

    public function submit(Request $request, int $attempt, QuizAction $action): JsonResponse
    {
        $model = QuizAttempt::query()->with('quiz.questions.options')->findOrFail($attempt);

        $this->denyAsNotFound($model, 'answer');

        return response()->json(['data' => $action->submit($request->user(), $model)]);
    }

    public function show(Request $request, int $attempt): JsonResponse
    {
        $model = QuizAttempt::query()->with(['quiz.questions.options', 'answers'])->findOrFail($attempt);

        $this->denyAsNotFound($model, 'view');

        return response()->json(['data' => new QuizAttemptResource($model)]);
    }

    /**
     * Cross-user access must not reveal existence (docs/api.md §1.1).
     */
    private function denyAsNotFound(QuizAttempt $attempt, string $ability): void
    {
        if (Gate::denies($ability, $attempt)) {
            abort(404);
        }
    }
}
