<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PathProgressStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PathDetailResource;
use App\Http\Resources\PathSummaryResource;
use App\Models\Path;
use App\Models\UserPathProgress;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PathController extends Controller
{
    public function index(Request $request, ProgressService $progress): JsonResponse
    {
        $query = Path::query()->published()->with('category')
            ->withCount(['modules', 'lessons']);

        if ($q = $request->string('q')->toString()) {
            if (strlen($q) >= (int) config('ctf.search.min_query_length', 2)) {
                $query->search($q);
            }
        }
        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->string('category')));
        }
        if ($request->filled('difficulty')) {
            $query->where('difficulty', $request->string('difficulty'));
        }

        $paginator = $query->orderBy('id')->paginate(min(100, (int) $request->integer('per_page', 20)));

        $user = $request->user('sanctum');
        $percents = $user
            ? $progress->progressPercentsFor($user, $paginator->getCollection())
            : [];
        $paginator->getCollection()->transform(function (Path $path) use ($percents) {
            $path->progress_percent = $percents[$path->id] ?? 0;
            $path->challenges_count = 0;

            return $path;
        });

        return response()->json([
            'data' => PathSummaryResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, Path $path, ProgressService $progress): JsonResponse
    {
        $this->authorize('view', $path);

        $path->load(['category', 'prerequisites', 'modules' => fn ($q) => $q->published()->withCount('lessons')]);
        $user = $request->user('sanctum');
        $required = $progress->publishedPrerequisites($path);
        $path->setRelation('prerequisites', $required);

        $completedIds = $user
            ? UserPathProgress::query()
                ->where('user_id', $user->id)
                ->where('status', PathProgressStatus::Completed)
                ->whereIn('path_id', $required->pluck('id'))
                ->pluck('path_id')
            : collect();

        foreach ($required as $prerequisite) {
            $prerequisite->viewer_completed = $completedIds->contains($prerequisite->id);
        }

        $path->progress_percent = $user ? $progress->progressPercent($user, $path) : 0;
        $path->completed = $user ? $progress->isPathComplete($user, $path) : false;
        $path->can_start = $required->every(fn (Path $pre) => (bool) $pre->viewer_completed);
        $path->started = $user ? $progress->hasStarted($user, $path) : false;
        $path->modules_count = $path->modules->count();
        $path->lessons_count = $path->modules->sum('lessons_count');
        $path->challenges_count = 0;

        foreach ($path->modules as $module) {
            $module->completed_lesson_count = 0;
            $module->challenge_count = 0;
        }

        return response()->json(['data' => new PathDetailResource($path)]);
    }

    public function start(Request $request, Path $path, ProgressService $progress): JsonResponse
    {
        $this->authorize('start', $path);
        $row = $progress->startPath($request->user(), $path);

        return response()->json(['data' => [
            'path_id' => $path->id,
            'status' => $row->status?->value ?? $row->status,
            'started_at' => optional($row->started_at)?->toIso8601String(),
        ]]);
    }

    public function progress(Request $request, Path $path, ProgressService $progress): JsonResponse
    {
        $this->authorize('start', $path);
        $breakdown = $progress->breakdown($request->user(), $path);

        return response()->json(['data' => $breakdown]);
    }
}
