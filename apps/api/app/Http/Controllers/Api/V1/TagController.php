<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagResource;
use App\Models\Tag;

/**
 * Tag lookup (docs/api.md §3). No auth, full list — tags carry no
 * visibility state.
 */
class TagController extends Controller
{
    public function index(): mixed
    {
        $tags = Tag::query()->orderBy('name')->orderBy('id')->get();

        return TagResource::collection($tags);
    }
}
