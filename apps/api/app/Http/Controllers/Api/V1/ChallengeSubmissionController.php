<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\SubmitFlagAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Challenge\SubmitFlagRequest;
use App\Models\Challenge;
use Illuminate\Http\JsonResponse;

final class ChallengeSubmissionController extends Controller
{
    public function store(SubmitFlagRequest $request, Challenge $challenge, SubmitFlagAction $action): JsonResponse
    {
        $this->authorize('submit', $challenge);
        $result = $action->handle($request->user(), $challenge, $request->validated('flag'));

        return response()->json(['data' => $result]);
    }
}
