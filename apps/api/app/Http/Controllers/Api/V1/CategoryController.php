<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Active categories only for guests and learners; staff see all
 * (docs/api.md §3).
 */
class CategoryController extends Controller
{
    public function index(Request $request): mixed
    {
        Gate::authorize('viewAny', Category::class);

        $viewer = $request->user('sanctum');
        $isStaff = $viewer !== null && $viewer->hasRole(Role::Moderator);

        $categories = Category::query()
            ->when(! $isStaff, fn ($query) => $query->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return CategoryResource::collection($categories);
    }
}
