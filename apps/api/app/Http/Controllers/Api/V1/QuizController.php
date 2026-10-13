<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\QuizAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuizResource;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Quiz reader + attempt lifecycle (docs/api.md §3). Questions never
 * expose is_correct until the caller's own attempt is submitted.
 */
class QuizController extends Controller
{
    public function show(int $quiz): JsonResponse
    {
        $model = Quiz::query()->with(['questions.options'])->findOrFail($quiz);

        Gate::authorize('view', $model);

        return response()->json(['data' => new QuizResource($model)]);
    }

    public function startAttempt(Request $request, int $quiz, QuizAction $action): JsonResponse
    {
        $model = Quiz::query()->findOrFail($quiz);

        Gate::authorize('view', $model);

        $attempt = $action->startAttempt($request->user(), $model);

        return response()->json(['data' => ['attempt' => ['id' => $attempt->id]]], 201);
    }
}
