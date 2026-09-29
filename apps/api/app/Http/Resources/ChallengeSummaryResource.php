<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChallengeSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
                'color' => $this->category->color,
            ]),
            'difficulty' => $this->difficulty?->value ?? $this->difficulty,
            'points' => (int) $this->points,
            'estimated_minutes' => (int) $this->estimated_minutes,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'solved' => (bool) ($this->solved ?? false),
            'solve_count' => (int) $this->solve_count,
            'status' => $this->status?->value ?? $this->status,
        ];
    }
}
