<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\TransitionChallengeAction;
use App\Actions\Admin\UpsertChallengeAction;
use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChallengeRequest;
use App\Http\Resources\Admin\AdminChallengeResource;
use App\Models\Challenge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Staff challenge management: full catalog including drafts.
 * Authorization is the `role:admin,moderator` route middleware (plus
 * admin-only subgroups for users/audit); every mutation audits via
 * its action. Destroy archives rather than deleting (solves and
 * submissions reference the row forever).
 */
class ChallengeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['draft', 'review', 'published', 'archived'])],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Challenge::query()
            ->with(['tags'])
            ->withCount(['flags', 'files', 'hints'])
            ->latest('id');

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return AdminChallengeResource::collection($query->paginate($filters['per_page'] ?? 20));
    }

    public function store(ChallengeRequest $request, UpsertChallengeAction $action): JsonResponse
    {
        $challenge = $action->execute($request->user(), null, $request->validated(), $request);
        $challenge->load(['tags']);

        return response()->json(['data' => new AdminChallengeResource($challenge)], 201);
    }

    public function show(Challenge $challenge): AdminChallengeResource
    {
        $challenge->load(['tags'])->loadCount(['flags', 'files', 'hints']);

        return new AdminChallengeResource($challenge);
    }

    public function update(ChallengeRequest $request, Challenge $challenge, UpsertChallengeAction $action): AdminChallengeResource
    {
        $updated = $action->execute($request->user(), $challenge, $request->validated(), $request);
        $updated->load(['tags']);

        return new AdminChallengeResource($updated);
    }

    public function destroy(Request $request, Challenge $challenge, TransitionChallengeAction $action): AdminChallengeResource
    {
        $archived = $action->execute($request->user(), $challenge, ContentStatus::Archived, $request);
        $archived->load(['tags']);

        return new AdminChallengeResource($archived);
    }

    public function publish(Request $request, Challenge $challenge, TransitionChallengeAction $action): AdminChallengeResource
    {
        return $this->transition($request, $challenge, $action, ContentStatus::Published);
    }

    public function unpublish(Request $request, Challenge $challenge, TransitionChallengeAction $action): AdminChallengeResource
    {
        return $this->transition($request, $challenge, $action, ContentStatus::Draft);
    }

    public function archive(Request $request, Challenge $challenge, TransitionChallengeAction $action): AdminChallengeResource
    {
        return $this->transition($request, $challenge, $action, ContentStatus::Archived);
    }

    public function review(Request $request, Challenge $challenge, TransitionChallengeAction $action): AdminChallengeResource
    {
        return $this->transition($request, $challenge, $action, ContentStatus::Review);
    }

    private function transition(
        Request $request,
        Challenge $challenge,
        TransitionChallengeAction $action,
        ContentStatus $to,
    ): AdminChallengeResource {
        $updated = $action->execute($request->user(), $challenge, $to, $request);
        $updated->load(['tags']);

        return new AdminChallengeResource($updated);
    }
}
