<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QuizQuestion
 */
class AdminQuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'question' => $this->question,
            'type' => $this->type->value,
            'explanation' => $this->explanation,
            'points' => (int) $this->points,
            'position' => (int) $this->position,
            'is_published' => (bool) $this->is_published,
            'options' => AdminOptionResource::collection($this->whenLoaded('options')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
