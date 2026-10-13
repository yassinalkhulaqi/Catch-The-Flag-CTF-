<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\UpsertTagAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TagRequest;
use App\Http\Resources\Admin\AdminTagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Staff tag management.
 */
class TagController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AdminTagResource::collection(Tag::query()->withCount('challenges')->orderBy('id')->get());
    }

    public function store(TagRequest $request, UpsertTagAction $action): JsonResponse
    {
        $tag = $action->execute($request->user(), null, $request->validated(), $request);

        return response()->json(['data' => new AdminTagResource($tag)], 201);
    }

    public function show(Tag $tag): AdminTagResource
    {
        $tag->loadCount('challenges');

        return new AdminTagResource($tag);
    }

    public function update(TagRequest $request, Tag $tag, UpsertTagAction $action): AdminTagResource
    {
        return new AdminTagResource($action->execute($request->user(), $tag, $request->validated(), $request));
    }

    public function destroy(Request $request, Tag $tag, DeleteModelAction $action): JsonResponse
    {
        $action->execute($request->user(), $tag, $request, 'tag.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }
}
