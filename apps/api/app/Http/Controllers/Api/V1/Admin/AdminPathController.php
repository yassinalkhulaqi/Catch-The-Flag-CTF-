<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\PublishPathAction;
use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePathRequest;
use App\Http\Requests\Admin\UpdatePathRequest;
use App\Http\Resources\PathDetailResource;
use App\Http\Resources\PathSummaryResource;
use App\Models\Path;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminPathController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Path::class);
        $items = Path::query()->with('category')->withCount('modules')->orderByDesc('id')->paginate(20);
        $items->getCollection()->each(function (Path $p) {
            $p->progress_percent = 0;
            $p->lesson_count = 0;
            $p->lessons_count = 0;
            $p->challenges_count = 0;
        });

        return response()->json([
            'data' => PathSummaryResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(StorePathRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Path::class);
        $data = $request->safe()->except(['prerequisite_ids']);
        $path = new Path;
        $path->fill($data);
        $path->forceFill([
            'status' => ContentStatus::Draft->value,
            'created_by' => $request->user()->id,
        ])->save();

        if ($request->filled('prerequisite_ids')) {
            $path->prerequisites()->sync($request->validated('prerequisite_ids'));
        }

        $audit->log($request->user(), 'path.create', $path, $data);

        return response()->json(['data' => new PathSummaryResource($path->load('category'))], 201);
    }

    public function show(Path $path): JsonResponse
    {
        $this->authorize('view', $path);
        $path->load(['category', 'prerequisites', 'modules.lessons']);
        $path->progress_percent = 0;
        $path->completed = false;
        $path->modules_count = $path->modules->count();
        $path->lessons_count = $path->modules->sum(fn ($m) => $m->lessons->count());
        $path->challenges_count = 0;

        return response()->json(['data' => new PathDetailResource($path)]);
    }

    public function update(UpdatePathRequest $request, Path $path, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $path);
        $data = $request->safe()->except(['prerequisite_ids']);
        $path->fill($data)->save();
        if ($request->exists('prerequisite_ids')) {
            $path->prerequisites()->sync($request->validated('prerequisite_ids') ?? []);
        }
        $audit->log($request->user(), 'path.update', $path, $data);

        return response()->json(['data' => new PathSummaryResource($path->fresh('category'))]);
    }

    public function destroy(Request $request, Path $path, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $path);
        $audit->log($request->user(), 'path.delete', $path, ['id' => $path->id]);
        $path->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function publish(Request $request, Path $path, PublishPathAction $action): JsonResponse
    {
        $this->authorize('publish', $path);

        return response()->json(['data' => new PathSummaryResource($action->handle($request->user(), $path)->load('category'))]);
    }

    public function unpublish(Request $request, Path $path, AuditLogger $audit): JsonResponse
    {
        $this->authorize('publish', $path);
        $path->forceFill(['status' => ContentStatus::Draft->value])->save();
        $audit->log($request->user(), 'path.unpublish', $path, ['status' => ContentStatus::Draft->value]);

        return response()->json(['data' => new PathSummaryResource($path->load('category'))]);
    }

    public function archive(Request $request, Path $path, AuditLogger $audit): JsonResponse
    {
        $this->authorize('publish', $path);
        $path->forceFill(['status' => ContentStatus::Archived->value])->save();
        $audit->log($request->user(), 'path.archive', $path, ['status' => ContentStatus::Archived->value]);

        return response()->json(['data' => new PathSummaryResource($path->load('category'))]);
    }

    public function review(Request $request, Path $path, AuditLogger $audit): JsonResponse
    {
        $this->authorize('publish', $path);
        $path->forceFill(['status' => ContentStatus::Review->value])->save();
        $audit->log($request->user(), 'path.review', $path, ['status' => ContentStatus::Review->value]);

        return response()->json(['data' => new PathSummaryResource($path->load('category'))]);
    }
}
