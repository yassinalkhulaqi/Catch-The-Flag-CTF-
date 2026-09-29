<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminTagController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Tag::class);

        return response()->json(['data' => TagResource::collection(Tag::query()->orderBy('name')->get())]);
    }

    public function store(StoreTagRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Tag::class);
        $tag = Tag::query()->create($request->validated());
        $audit->log($request->user(), 'tag.create', $tag, $request->validated());

        return response()->json(['data' => new TagResource($tag)], 201);
    }

    public function destroy(Request $request, Tag $tag, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $tag);
        $audit->log($request->user(), 'tag.delete', $tag, ['id' => $tag->id]);
        $tag->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
