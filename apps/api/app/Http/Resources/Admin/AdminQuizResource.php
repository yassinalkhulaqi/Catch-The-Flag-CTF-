<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff quiz shape. Unlike the learner payload, options include
 * `is_correct` — correctness is authoring data here, not a leak.
 *
 * @mixin Quiz
 */
class AdminQuizResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'pass_score' => (int) $this->pass_score,
            'position' => (int) $this->position,
            'is_published' => (bool) $this->is_published,
            'module_id' => $this->module_id,
            'lesson_id' => $this->lesson_id,
            'questions' => AdminQuestionResource::collection($this->whenLoaded('questions')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
