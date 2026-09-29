<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChallengeDetailResource;
use App\Http\Resources\ChallengeSummaryResource;
use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\HintUnlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ChallengeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $query = Challenge::query()->published()->with(['category', 'tags']);

        if ($q = $request->string('q')->toString()) {
            if (strlen($q) >= 2) {
                $query->search($q);
            }
        }
        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->string('category')));
        }
        if ($request->filled('difficulty')) {
            $query->where('difficulty', $request->string('difficulty'));
        }
        if ($request->filled('min_points')) {
            $query->where('points', '>=', (int) $request->integer('min_points'));
        }
        if ($request->filled('max_points')) {
            $query->where('points', '<=', (int) $request->integer('max_points'));
        }
        if ($request->filled('tags')) {
            $slugs = array_filter(explode(',', $request->string('tags')->toString()));
            foreach ($slugs as $slug) {
                $query->whereHas('tags', fn ($q) => $q->where('slug', $slug));
            }
        }

        $sort = $request->string('sort', 'id')->toString();
        $dir = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $col = ltrim($sort, '-');
        $allowed = ['id', 'points', 'created_at', 'solve_count', 'title'];
        if (! in_array($col, $allowed, true)) {
            $col = 'id';
        }
        $query->orderBy($col, $dir)->orderBy('id');

        $paginator = $query->paginate(min(100, (int) $request->integer('per_page', 20)));

        $solvedIds = [];
        if ($user) {
            $solvedIds = ChallengeSolve::query()
                ->where('user_id', $user->id)
                ->whereIn('challenge_id', $paginator->getCollection()->pluck('id'))
                ->pluck('challenge_id')
                ->all();
        }

        if ($request->filled('solved') && $user) {
            // filter after would break pagination; apply before if needed
        }

        $paginator->getCollection()->transform(function (Challenge $c) use ($solvedIds) {
            $c->solved = in_array($c->id, $solvedIds, true);

            return $c;
        });

        return response()->json([
            'data' => ChallengeSummaryResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, Challenge $challenge): JsonResponse
    {
        $this->authorize('view', $challenge);

        $user = $request->user('sanctum');
        $challenge->load(['category', 'tags', 'files', 'hints', 'author']);

        $unlockedHintIds = [];
        $hintCost = 0;
        $solved = false;
        if ($user) {
            $unlocks = HintUnlock::query()
                ->where('user_id', $user->id)
                ->where('challenge_id', $challenge->id)
                ->get();
            $unlockedHintIds = $unlocks->pluck('hint_id')->all();
            $hintCost = (int) $unlocks->sum('points_cost');
            $solved = ChallengeSolve::query()
                ->where('user_id', $user->id)
                ->where('challenge_id', $challenge->id)
                ->exists();
        }

        foreach ($challenge->hints as $hint) {
            $hint->unlocked = in_array($hint->id, $unlockedHintIds, true);
        }

        $challenge->solved = $solved;
        $challenge->points_remaining = $solved ? 0 : max(0, (int) $challenge->points - $hintCost);
        $challenge->setRelation('related', Challenge::query()
            ->published()
            ->where('category_id', $challenge->category_id)
            ->where('id', '!=', $challenge->id)
            ->with(['category', 'tags'])
            ->limit(5)
            ->get());

        return response()->json(['data' => new ChallengeDetailResource($challenge)]);
    }

    public function solves(Challenge $challenge): JsonResponse
    {
        $this->authorize('view', $challenge);

        $solves = ChallengeSolve::query()
            ->where('challenge_id', $challenge->id)
            ->with('user:id,name')
            ->orderByDesc('solved_at')
            ->limit(50)
            ->get()
            ->map(fn ($s) => [
                'name' => $s->user?->name,
                'solved_at' => optional($s->solved_at)?->toIso8601String(),
            ]);

        return response()->json(['data' => $solves]);
    }
}
