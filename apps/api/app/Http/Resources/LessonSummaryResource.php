<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lesson header only — body content is served by the lesson detail
 * endpoint (Phase 3), never inside path payloads.
 *
 * @mixin Lesson
 */
class LessonSummaryResource extends JsonResource
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
            'position' => (int) $this->position,
            'estimated_minutes' => (int) $this->estimated_minutes,
        ];
    }
}
