<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $includeAnswers = (bool) ($this->include_answers ?? false);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'pass_score' => (int) $this->pass_score,
            'questions' => $this->whenLoaded('questions', fn () => $this->questions->map(function ($q) use ($includeAnswers) {
                $data = [
                    'id' => $q->id,
                    'question' => $q->question,
                    'type' => $q->type?->value ?? $q->type,
                    'points' => (int) $q->points,
                    'position' => (int) $q->position,
                    'options' => $q->options->map(fn ($o) => [
                        'id' => $o->id,
                        'option_text' => $o->option_text,
                    ])->values(),
                ];
                if ($includeAnswers) {
                    $data['explanation'] = $q->explanation;
                    $data['answered'] = $q->answered ?? null;
                }

                return $data;
            })->values()),
        ];
    }
}
