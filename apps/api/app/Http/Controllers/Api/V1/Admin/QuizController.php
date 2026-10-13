<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\UpsertOptionAction;
use App\Actions\Admin\UpsertQuestionAction;
use App\Actions\Admin\UpsertQuizAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OptionRequest;
use App\Http\Requests\Admin\QuestionRequest;
use App\Http\Requests\Admin\QuizRequest;
use App\Http\Resources\Admin\AdminOptionResource;
use App\Http\Resources\Admin\AdminQuestionResource;
use App\Http\Resources\Admin\AdminQuizResource;
use App\Models\Lesson;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff quiz/question/option management. Quizzes hang off exactly one
 * parent (module or lesson, from the route); questions and options nest
 * below. Option correctness is visible here (authoring data).
 */
class QuizController extends Controller
{
    // --- quizzes ---

    public function storeForModule(QuizRequest $request, PathModule $module, UpsertQuizAction $action): JsonResponse
    {
        $quiz = $action->execute($request->user(), $module, null, null, $request->validated(), $request);

        return response()->json(['data' => new AdminQuizResource($quiz)], 201);
    }

    public function storeForLesson(QuizRequest $request, Lesson $lesson, UpsertQuizAction $action): JsonResponse
    {
        $quiz = $action->execute($request->user(), null, $lesson, null, $request->validated(), $request);

        return response()->json(['data' => new AdminQuizResource($quiz)], 201);
    }

    public function show(Quiz $quiz): AdminQuizResource
    {
        $quiz->load(['questions.options']);

        return new AdminQuizResource($quiz);
    }

    public function update(QuizRequest $request, Quiz $quiz, UpsertQuizAction $action): AdminQuizResource
    {
        $updated = $action->execute($request->user(), null, null, $quiz, $request->validated(), $request);
        $updated->load(['questions.options']);

        return new AdminQuizResource($updated);
    }

    public function destroy(Request $request, Quiz $quiz, DeleteModelAction $action): JsonResponse
    {
        $action->execute($request->user(), $quiz, $request, 'quiz.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    // --- questions ---

    public function questionIndex(Quiz $quiz): JsonResponse
    {
        $questions = $quiz->questions()->with(['options'])->orderBy('position')->orderBy('id')->get();

        return response()->json(['data' => AdminQuestionResource::collection($questions)]);
    }

    public function questionStore(QuestionRequest $request, Quiz $quiz, UpsertQuestionAction $action): JsonResponse
    {
        $question = $action->execute($request->user(), $quiz, null, $request->validated(), $request);

        return response()->json(['data' => new AdminQuestionResource($question)], 201);
    }

    public function questionShow(QuizQuestion $question): AdminQuestionResource
    {
        $question->load(['options']);

        return new AdminQuestionResource($question);
    }

    public function questionUpdate(
        QuestionRequest $request,
        Quiz $quiz,
        QuizQuestion $question,
        UpsertQuestionAction $action,
    ): AdminQuestionResource {
        $this->scopeQuestion($quiz, $question);

        return new AdminQuestionResource($action->execute($request->user(), $quiz, $question, $request->validated(), $request));
    }

    public function questionDestroy(Request $request, Quiz $quiz, QuizQuestion $question, DeleteModelAction $action): JsonResponse
    {
        $this->scopeQuestion($quiz, $question);

        $action->execute($request->user(), $question, $request, 'quiz_question.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    // --- options ---

    public function optionIndex(QuizQuestion $question): JsonResponse
    {
        $options = $question->options()->orderBy('position')->orderBy('id')->get();

        return response()->json(['data' => AdminOptionResource::collection($options)]);
    }

    public function optionStore(OptionRequest $request, QuizQuestion $question, UpsertOptionAction $action): JsonResponse
    {
        $option = $action->execute($request->user(), $question, null, $request->validated(), $request);

        return response()->json(['data' => new AdminOptionResource($option)], 201);
    }

    public function optionUpdate(
        OptionRequest $request,
        QuizQuestion $question,
        QuizOption $option,
        UpsertOptionAction $action,
    ): AdminOptionResource {
        $this->scopeOption($question, $option);

        return new AdminOptionResource($action->execute($request->user(), $question, $option, $request->validated(), $request));
    }

    public function optionDestroy(Request $request, QuizQuestion $question, QuizOption $option, DeleteModelAction $action): JsonResponse
    {
        $this->scopeOption($question, $option);

        $action->execute($request->user(), $option, $request, 'quiz_option.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function scopeQuestion(Quiz $quiz, QuizQuestion $question): void
    {
        if ($question->quiz_id !== $quiz->id) {
            abort(404);
        }
    }

    private function scopeOption(QuizQuestion $question, QuizOption $option): void
    {
        if ($option->question_id !== $question->id) {
            abort(404);
        }
    }
}
