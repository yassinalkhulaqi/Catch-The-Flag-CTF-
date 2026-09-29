<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\GradeQuizAttemptAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Quiz\AnswerQuizRequest;
use App\Http\Resources\QuizAttemptResource;
use App\Http\Resources\QuizResource;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class QuizController extends Controller
{
    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('view', $quiz);
        $quiz->load(['questions' => fn ($q) => $q->published()->with('options')]);

        return response()->json(['data' => new QuizResource($quiz)]);
    }

    public function startAttempt(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('attempt', $quiz);

        $attempt = QuizAttempt::query()->create([
            'user_id' => $request->user()->id,
            'quiz_id' => $quiz->id,
            'started_at' => now(),
        ]);

        return response()->json(['data' => ['id' => $attempt->id, 'started_at' => $attempt->started_at->toIso8601String()]], 201);
    }

    public function answer(AnswerQuizRequest $request, QuizAttempt $attempt): JsonResponse
    {
        $this->authorize('answer', $attempt);

        QuizAttemptAnswer::query()->updateOrCreate(
            ['attempt_id' => $attempt->id, 'question_id' => $request->validated('question_id')],
            [
                'selected_option_ids' => $request->validated('selected_option_ids'),
                'is_correct' => false,
            ]
        );

        return response()->json(['data' => ['ok' => true]]);
    }

    public function submit(Request $request, QuizAttempt $attempt, GradeQuizAttemptAction $action): JsonResponse
    {
        $this->authorize('submit', $attempt);
        $result = $action->handle($request->user(), $attempt);

        return response()->json(['data' => [
            'id' => $result['attempt']->id,
            'score' => $result['score'],
            'passed' => $result['passed'],
            'correct_count' => $result['correct_count'],
            'total' => $result['total'],
        ]]);
    }

    public function showAttempt(Request $request, QuizAttempt $attempt): JsonResponse
    {
        $this->authorize('view', $attempt);
        $attempt->load(['quiz.questions.options', 'answers']);

        $correctCount = $attempt->answers->where('is_correct', true)->count();
        $attempt->correct_count = $correctCount;
        $attempt->total = $attempt->quiz->questions->count();

        $quiz = $attempt->quiz;
        $quiz->include_answers = $attempt->isCompleted();
        foreach ($quiz->questions as $question) {
            $answer = $attempt->answers->firstWhere('question_id', $question->id);
            $question->answered = $answer ? [
                'selected_option_ids' => $answer->selected_option_ids,
                'is_correct' => (bool) $answer->is_correct,
            ] : null;
            $question->setRelation('options', $question->options);
        }

        return response()->json(['data' => [
            'attempt' => (new QuizAttemptResource($attempt))->resolve(),
            'quiz' => (new QuizResource($quiz))->resolve(),
        ]]);
    }
}
