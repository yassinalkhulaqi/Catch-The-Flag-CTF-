<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Category::class);
        $items = Category::query()->orderBy('sort_order')->get();

        return response()->json(['data' => CategoryResource::collection($items)]);
    }

    public function store(StoreCategoryRequest $request, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', Category::class);
        $category = Category::query()->create($request->validated());
        $audit->log($request->user(), 'category.create', $category, $request->validated());

        return response()->json(['data' => new CategoryResource($category)], 201);
    }

    public function show(Category $category): JsonResponse
    {
        $this->authorize('view', $category);

        return response()->json(['data' => new CategoryResource($category)]);
    }

    public function update(UpdateCategoryRequest $request, Category $category, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $category);
        $before = $category->only(array_keys($request->validated()));
        $category->fill($request->validated())->save();
        $audit->log($request->user(), 'category.update', $category, ['before' => $before, 'after' => $request->validated()]);

        return response()->json(['data' => new CategoryResource($category)]);
    }

    public function destroy(Request $request, Category $category, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $category);
        $audit->log($request->user(), 'category.delete', $category, ['id' => $category->id]);
        $category->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
