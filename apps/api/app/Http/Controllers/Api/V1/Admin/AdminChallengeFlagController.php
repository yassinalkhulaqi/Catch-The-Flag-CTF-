<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\SetChallengeFlagAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFlagRequest;
use App\Http\Resources\ChallengeFlagResource;
use App\Models\Challenge;
use App\Models\ChallengeFlag;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class AdminChallengeFlagController extends Controller
{
    public function index(Challenge $challenge): JsonResponse
    {
        $this->authorize('update', $challenge);

        return response()->json(['data' => ChallengeFlagResource::collection($challenge->flags)]);
    }

    public function store(StoreFlagRequest $request, Challenge $challenge, SetChallengeFlagAction $action): JsonResponse
    {
        $this->authorize('update', $challenge);
        $flag = $action->handle($request->user(), $challenge, $request->validated());

        return response()->json(['data' => new ChallengeFlagResource($flag)], 201);
    }

    public function update(StoreFlagRequest $request, Challenge $challenge, ChallengeFlag $flag, SetChallengeFlagAction $action): JsonResponse
    {
        if ($flag->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Not found.');
        }
        $this->authorize('update', $challenge);
        $flag = $action->handle($request->user(), $challenge, $request->validated(), $flag);

        return response()->json(['data' => new ChallengeFlagResource($flag)]);
    }

    public function destroy(Request $request, Challenge $challenge, ChallengeFlag $flag, AuditLogger $audit): JsonResponse
    {
        if ($flag->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Not found.');
        }
        $this->authorize('update', $challenge);
        $audit->log($request->user(), 'flag.delete', $challenge, ['flag_id' => $flag->id]);
        $flag->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
