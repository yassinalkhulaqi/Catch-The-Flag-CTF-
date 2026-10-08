<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PathDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $summary = (new PathSummaryResource($this))->toArray($request);

        return array_merge($summary, [
            'description' => $this->description,
            'prerequisites' => $this->whenLoaded('prerequisites', fn () => $this->prerequisites->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'completed' => (bool) ($p->viewer_completed ?? false),
            ])->values()),
            'modules' => $this->whenLoaded('modules', fn () => $this->modules->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'description' => $m->description,
                'position' => (int) $m->position,
                'lesson_count' => $m->lessons_count ?? $m->lessons->count(),
                'challenge_count' => (int) ($m->challenge_count ?? 0),
                'completed_lesson_count' => (int) ($m->completed_lesson_count ?? 0),
            ])->values()),
            'completed' => (bool) ($this->completed ?? false),
            'can_start' => (bool) ($this->can_start ?? false),
            'started' => (bool) ($this->started ?? false),
        ]);
    }
}
