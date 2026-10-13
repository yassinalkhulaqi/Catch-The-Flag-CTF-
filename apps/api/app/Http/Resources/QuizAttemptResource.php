<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Own-attempt result. Only the owner ever sees this (QuizAttemptPolicy);
 * explanations and per-question correctness are included because the
 * attempt is submitted.
 *
 * @mixin QuizAttempt
 */
class QuizAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $answers = $this->whenLoaded('answers', function () {
            return $this->answers->mapWithKeys(fn ($answer): array => [
                $answer->question_id => [
                    'selected_option_ids' => array_values(array_map(intval(...), (array) $answer->selected_option_ids)),
                    'is_correct' => (bool) $answer->is_correct,
                ],
            ])->all();
        });

        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'score' => (int) $this->score,
            'passed' => (bool) $this->passed,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'questions' => $this->whenLoaded('quiz', function () use ($answers) {
                return $this->quiz->questions->map(function ($question) use ($answers): array {
                    $answer = is_array($answers) ? ($answers[$question->id] ?? null) : null;

                    return [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $question->type->value,
                        'points' => (int) $question->points,
                        'options' => $question->options->map(fn ($option): array => [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                        ])->values()->all(),
                        'explanation' => $question->explanation,
                        'answered' => $answer,
                    ];
                })->values()->all();
            }),
        ];
    }
}
