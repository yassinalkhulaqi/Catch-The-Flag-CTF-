<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Path;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Path card shape for listings (docs/api.md §3).
 *
 * @mixin Path
 */
class PathSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'difficulty' => $this->difficulty->value,
            'estimated_minutes' => (int) $this->estimated_minutes,
            'status' => $this->status->value,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
