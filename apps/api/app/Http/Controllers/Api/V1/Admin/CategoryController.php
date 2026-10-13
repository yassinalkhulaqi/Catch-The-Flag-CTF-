<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\UpsertCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\Admin\AdminCategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Staff taxonomy management.
 */
class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AdminCategoryResource::collection(Category::query()->orderBy('sort_order')->orderBy('id')->get());
    }

    public function store(CategoryRequest $request, UpsertCategoryAction $action): JsonResponse
    {
        $category = $action->execute($request->user(), null, $request->validated(), $request);

        return response()->json(['data' => new AdminCategoryResource($category)], 201);
    }

    public function show(Category $category): AdminCategoryResource
    {
        return new AdminCategoryResource($category);
    }

    public function update(CategoryRequest $request, Category $category, UpsertCategoryAction $action): AdminCategoryResource
    {
        return new AdminCategoryResource($action->execute($request->user(), $category, $request->validated(), $request));
    }

    public function destroy(Request $request, Category $category, DeleteModelAction $action): JsonResponse
    {
        $action->execute($request->user(), $category, $request, 'category.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }
}
