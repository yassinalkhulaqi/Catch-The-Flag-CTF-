<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\UpsertHintAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\HintRequest;
use App\Http\Resources\Admin\AdminHintResource;
use App\Models\Challenge;
use App\Models\ChallengeHint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff hint CRUD scoped to a challenge.
 */
class HintController extends Controller
{
    public function index(Challenge $challenge): JsonResponse
    {
        $hints = $challenge->hints()->orderBy('position')->orderBy('id')->get();

        return response()->json(['data' => AdminHintResource::collection($hints)]);
    }

    public function store(HintRequest $request, Challenge $challenge, UpsertHintAction $action): JsonResponse
    {
        $hint = $action->execute($request->user(), $challenge, null, $request->validated(), $request);

        return response()->json(['data' => new AdminHintResource($hint)], 201);
    }

    public function show(Challenge $challenge, ChallengeHint $hint): AdminHintResource
    {
        $this->scope($challenge, $hint);

        return new AdminHintResource($hint);
    }

    public function update(HintRequest $request, Challenge $challenge, ChallengeHint $hint, UpsertHintAction $action): AdminHintResource
    {
        $this->scope($challenge, $hint);

        return new AdminHintResource($action->execute($request->user(), $challenge, $hint, $request->validated(), $request));
    }

    public function destroy(Request $request, Challenge $challenge, ChallengeHint $hint, DeleteModelAction $action): JsonResponse
    {
        $this->scope($challenge, $hint);

        $action->execute($request->user(), $hint, $request, 'hint.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function scope(Challenge $challenge, ChallengeHint $hint): void
    {
        if ($hint->challenge_id !== $challenge->id) {
            abort(404);
        }
    }
}
