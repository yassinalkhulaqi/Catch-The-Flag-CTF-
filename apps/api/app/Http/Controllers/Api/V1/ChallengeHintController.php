<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\UnlockHintAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChallengeHintResource;
use App\Models\Challenge;
use App\Models\ChallengeHint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ChallengeHintController extends Controller
{
    public function unlock(Request $request, Challenge $challenge, ChallengeHint $hint, UnlockHintAction $action): JsonResponse
    {
        $this->authorize('unlock', $hint);
        $result = $action->handle($request->user(), $challenge, $hint);
        $hint->unlocked = true;

        return response()->json(['data' => [
            'hint' => (new ChallengeHintResource($hint))->resolve(),
            'points_remaining' => $result['points_remaining'],
        ]]);
    }
}
