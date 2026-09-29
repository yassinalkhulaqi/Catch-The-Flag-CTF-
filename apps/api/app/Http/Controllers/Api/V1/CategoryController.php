<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

final class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->active()
            ->withCount(['challenges' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => CategoryResource::collection($categories)]);
    }
}
