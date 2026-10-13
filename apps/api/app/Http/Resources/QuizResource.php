<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Quiz payload. Options NEVER include is_correct here — correctness is
 * revealed only on submitted attempts (docs/database.md §5).
 *
 * @mixin Quiz
 */
class QuizResource extends JsonResource
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
            'questions' => $this->whenLoaded('questions', function () {
                return $this->questions->map(fn ($question): array => [
                    'id' => $question->id,
                    'question' => $question->question,
                    'type' => $question->type->value,
                    'points' => (int) $question->points,
                    'position' => (int) $question->position,
                    'options' => $question->options->map(fn ($option): array => [
                        'id' => $option->id,
                        'option_text' => $option->option_text,
                    ])->values()->all(),
                ])->values()->all();
            }),
        ];
    }
}
