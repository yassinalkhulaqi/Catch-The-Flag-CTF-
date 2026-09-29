<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\PublishChallengeAction;
use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreChallengeRequest;
use App\Http\Requests\Admin\UpdateChallengeRequest;
use App\Http\Resources\ChallengeDetailResource;
use App\Http\Resources\ChallengeSummaryResource;
use App\Models\Challenge;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminChallengeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Challenge::class);
        $items = Challenge::query()->with(['category', 'tags'])->orderByDesc('id')->paginate(20);
        $items->getCollection()->each(fn (Challenge $c) => $c->solved = false);

        return response()->json([
            'data' => ChallengeSummaryResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(StoreChallengeRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Challenge::class);
        $data = $request->safe()->except(['tag_ids']);
        $challenge = new Challenge;
        $challenge->fill($data);
        $challenge->forceFill([
            'status' => ContentStatus::Draft->value,
            'author_id' => $request->user()->id,
            'solve_count' => 0,
            'flag_validation_type' => $data['flag_validation_type'] ?? 'static',
        ])->save();

        if ($request->filled('tag_ids')) {
            $challenge->tags()->sync($request->validated('tag_ids'));
        }

        $audit->log($request->user(), 'challenge.create', $challenge, $data);
        $challenge->load(['category', 'tags']);
        $challenge->solved = false;

        return response()->json(['data' => new ChallengeSummaryResource($challenge)], 201);
    }

    public function show(Challenge $challenge): JsonResponse
    {
        $this->authorize('view', $challenge);
        $challenge->load(['category', 'tags', 'files', 'hints', 'author']);
        $challenge->solved = false;
        $challenge->points_remaining = (int) $challenge->points;
        foreach ($challenge->hints as $hint) {
            $hint->unlocked = true; // admin sees content
        }
        $challenge->setRelation('related', collect());

        return response()->json(['data' => new ChallengeDetailResource($challenge)]);
    }

    public function update(UpdateChallengeRequest $request, Challenge $challenge, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $challenge);
        $data = $request->safe()->except(['tag_ids']);
        $challenge->fill($data)->save();
        if ($request->exists('tag_ids')) {
            $challenge->tags()->sync($request->validated('tag_ids') ?? []);
        }
        $audit->log($request->user(), 'challenge.update', $challenge, $data);
        $challenge->load(['category', 'tags']);
        $challenge->solved = false;

        return response()->json(['data' => new ChallengeSummaryResource($challenge)]);
    }

    public function destroy(Request $request, Challenge $challenge, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $challenge);
        $audit->log($request->user(), 'challenge.delete', $challenge, ['id' => $challenge->id]);
        $challenge->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function publish(Request $request, Challenge $challenge, PublishChallengeAction $action): JsonResponse
    {
        $this->authorize('publish', $challenge);
        $challenge = $action->handle($request->user(), $challenge)->load(['category', 'tags']);
        $challenge->solved = false;

        return response()->json(['data' => new ChallengeSummaryResource($challenge)]);
    }

    public function unpublish(Request $request, Challenge $challenge, AuditLogger $audit): JsonResponse
    {
        $this->authorize('publish', $challenge);
        $challenge->forceFill(['status' => ContentStatus::Draft->value])->save();
        $audit->log($request->user(), 'challenge.unpublish', $challenge, ['status' => 'draft']);
        $challenge->load(['category', 'tags']);
        $challenge->solved = false;

        return response()->json(['data' => new ChallengeSummaryResource($challenge)]);
    }

    public function archive(Request $request, Challenge $challenge, AuditLogger $audit): JsonResponse
    {
        $this->authorize('publish', $challenge);
        $challenge->forceFill(['status' => ContentStatus::Archived->value])->save();
        $audit->log($request->user(), 'challenge.archive', $challenge, ['status' => 'archived']);
        $challenge->load(['category', 'tags']);
        $challenge->solved = false;

        return response()->json(['data' => new ChallengeSummaryResource($challenge)]);
    }

    public function review(Request $request, Challenge $challenge, AuditLogger $audit): JsonResponse
    {
        $this->authorize('publish', $challenge);
        $challenge->forceFill(['status' => ContentStatus::Review->value])->save();
        $audit->log($request->user(), 'challenge.review', $challenge, ['status' => 'review']);
        $challenge->load(['category', 'tags']);
        $challenge->solved = false;

        return response()->json(['data' => new ChallengeSummaryResource($challenge)]);
    }

    public function preview(Challenge $challenge): JsonResponse
    {
        $this->authorize('view', $challenge);
        $challenge->load(['category', 'tags', 'files', 'hints', 'author']);
        $challenge->solved = false;
        $challenge->points_remaining = (int) $challenge->points;
        foreach ($challenge->hints as $hint) {
            $hint->unlocked = true;
        }
        $challenge->setRelation('related', collect());

        return response()->json(['data' => new ChallengeDetailResource($challenge)]);
    }
}
