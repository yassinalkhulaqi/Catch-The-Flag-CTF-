<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Path;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Path detail: modules with lesson headers, prerequisites, and the
 * viewer's own progress percent when authenticated (docs/api.md §3).
 * Lesson bodies are never embedded here.
 *
 * @mixin Path
 */
class PathDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user('sanctum');

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'thumbnail_url' => $this->thumbnail_path !== null
                ? Storage::disk('public')->url($this->thumbnail_path)
                : null,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'difficulty' => $this->difficulty->value,
            'estimated_minutes' => (int) $this->estimated_minutes,
            'status' => $this->status->value,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'modules' => $this->whenLoaded('modules', function () {
                return $this->modules->map(fn ($module): array => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'position' => (int) $module->position,
                    'lessons' => LessonSummaryResource::collection($module->lessons),
                ])->values()->all();
            }),
            'prerequisites' => PathSummaryResource::collection($this->whenLoaded('prerequisites')),
            'progress_percent' => $this->when($viewer !== null, fn (): int => $this->progressPercent((int) $viewer->id)),
        ];
    }

    /**
     * Lesson-completion percent over published lessons (docs/database.md §8).
     */
    private function progressPercent(int $userId): int
    {
        $lessonIds = Lesson::query()
            ->whereHas('module', function ($module): void {
                $module->where('path_id', $this->id)->where('is_published', true);
            })
            ->where('is_published', true)
            ->pluck('id');

        $total = $lessonIds->count();

        if ($total === 0) {
            return 0;
        }

        $completed = LessonCompletion::query()
            ->where('user_id', $userId)
            ->whereIn('lesson_id', $lessonIds)
            ->count();

        return (int) round($completed / $total * 100);
    }
}
