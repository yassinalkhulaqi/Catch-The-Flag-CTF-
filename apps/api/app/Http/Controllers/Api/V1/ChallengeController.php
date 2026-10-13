<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChallengeIndexRequest;
use App\Http\Resources\ChallengeDetailResource;
use App\Http\Resources\ChallengeSummaryResource;
use App\Models\Challenge;
use App\Services\ChallengeSearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Public challenge catalog (docs/api.md §3). Accepts id OR slug on
 * detail. Invisible records are 404 for everyone without staff
 * visibility — never 403 (no existence oracle).
 */
class ChallengeController extends Controller
{
    public function index(ChallengeIndexRequest $request, ChallengeSearchService $search): mixed
    {
        Gate::authorize('viewAny', Challenge::class);

        $challenges = $search->search(
            $request->validated(),
            $request->user('sanctum'),
        );

        return ChallengeSummaryResource::collection($challenges);
    }

    public function show(Request $request, string $challenge): ChallengeDetailResource
    {
        $model = $this->resolve($challenge);

        if ($model === null || Gate::denies('view', $model)) {
            abort(404);
        }

        $viewer = $request->user('sanctum');

        $model->load([
            'category',
            'tags',
            'author',
            'files',
            'hints',
            'solves' => fn ($query) => $query->where('user_id', $viewer?->id),
        ]);

        return new ChallengeDetailResource($model);
    }

    private function resolve(string $key): ?Challenge
    {
        $query = Challenge::query();

        // Numeric keys may be ids; anything else is slug-only so
        // PostgreSQL never sees a non-numeric comparison on the id column.
        if (ctype_digit($key)) {
            $query->where('id', (int) $key)->orWhere('slug', $key);
        } else {
            $query->where('slug', $key);
        }

        return $query->first();
    }
}
