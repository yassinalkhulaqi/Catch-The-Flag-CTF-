<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\QuizQuestionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuizRequest;
use App\Http\Resources\QuizResource;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class AdminQuizController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('create', Quiz::class);
        $items = Quiz::query()->with('questions.options')->orderByDesc('id')->paginate(20);
        foreach ($items->items() as $quiz) {
            $quiz->include_answers = true;
        }

        return response()->json([
            'data' => QuizResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(StoreQuizRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Quiz::class);
        $quiz = Quiz::query()->create($request->validated());
        $audit->log($request->user(), 'quiz.create', $quiz, $request->validated());

        return response()->json(['data' => new QuizResource($quiz)], 201);
    }

    public function show(Quiz $quiz): JsonResponse
    {
        $this->authorize('update', $quiz);
        $quiz->load('questions.options');
        $quiz->include_answers = true;

        return response()->json(['data' => new QuizResource($quiz)]);
    }

    public function update(StoreQuizRequest $request, Quiz $quiz, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $quiz);
        $quiz->fill($request->validated())->save();
        $audit->log($request->user(), 'quiz.update', $quiz, $request->validated());
        $quiz->load('questions.options');
        $quiz->include_answers = true;

        return response()->json(['data' => new QuizResource($quiz)]);
    }

    public function destroy(Request $request, Quiz $quiz, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $quiz);
        $audit->log($request->user(), 'quiz.delete', $quiz, ['id' => $quiz->id]);
        $quiz->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function storeQuestion(Request $request, Quiz $quiz, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $quiz);
        $data = $request->validate([
            'question' => ['required', 'string'],
            'type' => ['required', Rule::enum(QuizQuestionType::class)],
            'explanation' => ['nullable', 'string'],
            'points' => ['sometimes', 'integer', 'min:1'],
            'position' => ['sometimes', 'integer', 'min:0'],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => ['required', 'string'],
            'options.*.is_correct' => ['required', 'boolean'],
            'options.*.position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $question = $quiz->questions()->create(collect($data)->except('options')->all());
        foreach ($data['options'] as $i => $opt) {
            $question->options()->create([
                'option_text' => $opt['option_text'],
                'is_correct' => $opt['is_correct'],
                'position' => $opt['position'] ?? $i,
            ]);
        }
        $audit->log($request->user(), 'quiz.question.create', $quiz, ['question_id' => $question->id]);
        $quiz->load('questions.options');
        $quiz->include_answers = true;

        return response()->json(['data' => new QuizResource($quiz)], 201);
    }

    public function updateQuestion(Request $request, Quiz $quiz, QuizQuestion $question, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $quiz);
        abort_unless($question->quiz_id === $quiz->id, 404);

        $data = $request->validate([
            'question' => ['sometimes', 'string'],
            'type' => ['sometimes', Rule::enum(QuizQuestionType::class)],
            'explanation' => ['nullable', 'string'],
            'points' => ['sometimes', 'integer', 'min:1'],
            'position' => ['sometimes', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
            'options' => ['sometimes', 'array', 'min:2'],
            'options.*.option_text' => ['required_with:options', 'string'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
            'options.*.position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $question->fill(collect($data)->except('options')->all())->save();
        if (isset($data['options'])) {
            $question->options()->delete();
            foreach ($data['options'] as $i => $opt) {
                $question->options()->create([
                    'option_text' => $opt['option_text'],
                    'is_correct' => $opt['is_correct'],
                    'position' => $opt['position'] ?? $i,
                ]);
            }
        }
        $audit->log($request->user(), 'quiz.question.update', $quiz, ['question_id' => $question->id]);
        $quiz->load('questions.options');
        $quiz->include_answers = true;

        return response()->json(['data' => new QuizResource($quiz)]);
    }

    public function destroyQuestion(Request $request, Quiz $quiz, QuizQuestion $question, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $quiz);
        abort_unless($question->quiz_id === $quiz->id, 404);
        $audit->log($request->user(), 'quiz.question.delete', $quiz, ['question_id' => $question->id]);
        $question->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
