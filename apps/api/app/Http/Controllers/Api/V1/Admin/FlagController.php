<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\SetChallengeFlagAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChallengeFlagRequest;
use App\Http\Resources\Admin\AdminFlagResource;
use App\Models\Challenge;
use App\Models\ChallengeFlag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Write-only flag management. GET returns identity/state metadata
 * only; POST/PUT accept the plaintext value but never echo it. There
 * is intentionally no reveal endpoint (docs/security.md §5).
 */
class FlagController extends Controller
{
    public function index(Challenge $challenge): JsonResponse
    {
        $flags = $challenge->flags()->latest('id')->get();

        return response()->json(['data' => AdminFlagResource::collection($flags)]);
    }

    public function store(
        ChallengeFlagRequest $request,
        Challenge $challenge,
        SetChallengeFlagAction $action,
    ): JsonResponse {
        $validated = $request->validated();

        $flag = $action->execute(
            $request->user(),
            $challenge,
            $validated['flag'],
            $validated['label'] ?? null,
            (bool) ($validated['case_sensitive'] ?? true),
            (bool) ($validated['is_active'] ?? true),
            $request,
        );

        return response()->json(['data' => new AdminFlagResource($flag)], 201);
    }

    public function show(Challenge $challenge, ChallengeFlag $flag): AdminFlagResource
    {
        $this->scope($challenge, $flag);

        return new AdminFlagResource($flag);
    }

    public function update(
        ChallengeFlagRequest $request,
        Challenge $challenge,
        ChallengeFlag $flag,
        SetChallengeFlagAction $action,
    ): AdminFlagResource {
        $this->scope($challenge, $flag);
        $validated = $request->validated();

        $updated = $action->execute(
            $request->user(),
            $challenge,
            $validated['flag'] ?? null,
            array_key_exists('label', $validated) ? $validated['label'] : $flag->label,
            array_key_exists('case_sensitive', $validated) ? (bool) $validated['case_sensitive'] : $flag->case_sensitive,
            array_key_exists('is_active', $validated) ? (bool) $validated['is_active'] : $flag->is_active,
            $request,
        );

        return new AdminFlagResource($updated);
    }

    public function destroy(Request $request, Challenge $challenge, ChallengeFlag $flag, DeleteModelAction $action): JsonResponse
    {
        $this->scope($challenge, $flag);

        $action->execute($request->user(), $flag, $request, 'challenge_flag.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * The flag id is only valid inside its challenge — no cross-object
     * access (IDOR guard).
     */
    private function scope(Challenge $challenge, ChallengeFlag $flag): void
    {
        if ($flag->challenge_id !== $challenge->id) {
            abort(404);
        }
    }
}
