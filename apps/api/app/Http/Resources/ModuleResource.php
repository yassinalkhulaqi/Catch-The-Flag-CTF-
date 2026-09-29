<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'path_id' => $this->path_id,
            'title' => $this->title,
            'description' => $this->description,
            'position' => (int) $this->position,
            'lessons' => $this->whenLoaded('lessons', fn () => $this->lessons->map(fn ($l) => [
                'id' => $l->id,
                'title' => $l->title,
                'slug' => $l->slug,
                'points' => 0,
                'difficulty' => 'beginner',
                'solved' => false,
                'position' => (int) $l->position,
                'completed' => (bool) ($l->completed ?? false),
                'estimated_minutes' => (int) $l->estimated_minutes,
            ])->values()),
        ];
    }
}
