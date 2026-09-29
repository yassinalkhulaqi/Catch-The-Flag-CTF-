<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHintRequest;
use App\Http\Resources\ChallengeHintResource;
use App\Models\Challenge;
use App\Models\ChallengeHint;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class AdminChallengeHintController extends Controller
{
    public function index(Challenge $challenge): JsonResponse
    {
        $this->authorize('update', $challenge);
        $hints = $challenge->hints;
        foreach ($hints as $hint) {
            $hint->unlocked = true;
        }

        return response()->json(['data' => ChallengeHintResource::collection($hints)]);
    }

    public function store(StoreHintRequest $request, Challenge $challenge, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $challenge);
        $hint = $challenge->hints()->create($request->validated());
        $audit->log($request->user(), 'hint.create', $challenge, ['hint_id' => $hint->id]);
        $hint->unlocked = true;

        return response()->json(['data' => new ChallengeHintResource($hint)], 201);
    }

    public function update(StoreHintRequest $request, Challenge $challenge, ChallengeHint $hint, AuditLogger $audit): JsonResponse
    {
        if ($hint->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Not found.');
        }
        $this->authorize('update', $challenge);
        $hint->fill($request->validated())->save();
        $audit->log($request->user(), 'hint.update', $challenge, ['hint_id' => $hint->id]);
        $hint->unlocked = true;

        return response()->json(['data' => new ChallengeHintResource($hint)]);
    }

    public function destroy(Request $request, Challenge $challenge, ChallengeHint $hint, AuditLogger $audit): JsonResponse
    {
        if ($hint->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Not found.');
        }
        $this->authorize('update', $challenge);
        $audit->log($request->user(), 'hint.delete', $challenge, ['hint_id' => $hint->id]);
        $hint->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
