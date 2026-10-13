<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lesson reader payload (docs/api.md §3). Linked challenges expose the
 * summary shape only; the quiz is a stub (id/title/passed) — questions
 * live behind the quiz endpoint.
 *
 * @mixin Lesson
 */
class LessonDetailResource extends JsonResource
{
    /**
     * @param  array{id: int, title: string, passed: bool}|null  $quizStub
     * @param  array<int, array{id: int, title: string, slug: string}>  $challengeRefs
     */
    public function __construct(
        $resource,
        private readonly ?array $quizStub,
        private readonly array $challengeRefs,
        private readonly ?int $prevLessonId,
        private readonly ?int $nextLessonId,
        private readonly bool $completed,
    ) {
        parent::__construct($resource);
    }

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
            'completed' => $this->completed,
            'challenges' => $this->challengeRefs,
            'quiz' => $this->quizStub,
            'prev_lesson_id' => $this->prevLessonId,
            'next_lesson_id' => $this->nextLessonId,
        ];
    }
}
