<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DuplicatePathAction;
use App\Actions\Admin\TransitionPathAction;
use App\Actions\Admin\UpsertPathAction;
use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PathRequest;
use App\Http\Resources\Admin\AdminPathResource;
use App\Models\Path;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Staff learning-path management including the publish workflow.
 * Destroy archives rather than deleting (progress rows reference it).
 */
class PathController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['draft', 'review', 'published', 'archived'])],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Path::query()->latest('id');

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return AdminPathResource::collection($query->paginate($filters['per_page'] ?? 20));
    }

    public function store(PathRequest $request, UpsertPathAction $action): JsonResponse
    {
        $path = $action->execute($request->user(), null, $request->validated(), $request);

        return response()->json(['data' => new AdminPathResource($path)], 201);
    }

    public function show(Path $path): AdminPathResource
    {
        $path->load(['modules.lessons']);

        return new AdminPathResource($path);
    }

    public function update(PathRequest $request, Path $path, UpsertPathAction $action): AdminPathResource
    {
        return new AdminPathResource($action->execute($request->user(), $path, $request->validated(), $request));
    }

    public function destroy(Request $request, Path $path, TransitionPathAction $action): AdminPathResource
    {
        return new AdminPathResource($action->execute($request->user(), $path, ContentStatus::Archived, $request));
    }

    public function publish(Request $request, Path $path, TransitionPathAction $action): AdminPathResource
    {
        return new AdminPathResource($action->execute($request->user(), $path, ContentStatus::Published, $request));
    }

    public function unpublish(Request $request, Path $path, TransitionPathAction $action): AdminPathResource
    {
        return new AdminPathResource($action->execute($request->user(), $path, ContentStatus::Draft, $request));
    }

    public function archive(Request $request, Path $path, TransitionPathAction $action): AdminPathResource
    {
        return new AdminPathResource($action->execute($request->user(), $path, ContentStatus::Archived, $request));
    }

    /**
     * Deep-clone this path as a draft (modules, lessons, linked challenges and quizzes).
     */
    public function duplicate(Request $request, Path $path, DuplicatePathAction $action): JsonResponse
    {
        $copy = $action->execute($request->user(), $path, $request);

        return response()->json(['data' => [
            'id' => $copy->id,
            'slug' => $copy->slug,
            'title' => $copy->title,
            'status' => $copy->status instanceof ContentStatus ? $copy->status->value : $copy->status,
        ]], 201);
    }

    public function review(Request $request, Path $path, TransitionPathAction $action): AdminPathResource
    {
        return new AdminPathResource($action->execute($request->user(), $path, ContentStatus::Review, $request));
    }
}
