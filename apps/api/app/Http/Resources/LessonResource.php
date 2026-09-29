<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'content' => $this->content,
            'position' => (int) $this->position,
            'estimated_minutes' => (int) $this->estimated_minutes,
            'completed' => (bool) ($this->completed ?? false),
            'challenges' => $this->whenLoaded('challenges', fn () => $this->challenges->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'slug' => $c->slug,
                'points' => (int) $c->points,
                'difficulty' => $c->difficulty?->value ?? $c->difficulty,
                'solved' => (bool) ($c->solved ?? false),
            ])->values()),
            'quiz' => $this->whenLoaded('quiz', fn () => $this->quiz ? [
                'id' => $this->quiz->id,
                'title' => $this->quiz->title,
                'passed' => (bool) ($this->quiz_passed ?? false),
            ] : null),
            'prev_lesson_id' => $this->prev_lesson_id ?? null,
            'next_lesson_id' => $this->next_lesson_id ?? null,
        ];
    }
}
