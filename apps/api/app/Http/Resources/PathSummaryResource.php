<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PathSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'difficulty' => $this->difficulty?->value ?? $this->difficulty,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
                'color' => $this->category->color,
            ] : null),
            'thumbnail_url' => $this->thumbnailUrl(),
            'estimated_minutes' => (int) $this->estimated_minutes,
            'module_count' => (int) ($this->modules_count ?? $this->whenLoaded('modules', fn () => $this->modules->count(), 0)),
            'lesson_count' => (int) ($this->lessons_count ?? 0),
            'challenge_count' => (int) ($this->challenges_count ?? 0),
            'progress_percent' => (int) ($this->progress_percent ?? 0),
            'status' => $this->status?->value ?? $this->status,
        ];
    }
}
