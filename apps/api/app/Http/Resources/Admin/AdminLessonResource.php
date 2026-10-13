<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff lesson shape: full body content plus linked-challenge summary
 * (flags excluded — only id/title/slug/status).
 *
 * @mixin Lesson
 */
class AdminLessonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
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
            'is_published' => (bool) $this->is_published,
            'challenges' => $this->whenLoaded('challenges', function () {
                return $this->challenges->map(fn ($challenge): array => [
                    'id' => $challenge->id,
                    'title' => $challenge->title,
                    'slug' => $challenge->slug,
                    'status' => $challenge->status->value,
                ])->values()->all();
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
