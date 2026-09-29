<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'score' => (int) $this->score,
            'passed' => (bool) $this->passed,
            'correct_count' => (int) ($this->correct_count ?? 0),
            'total' => (int) ($this->total ?? 0),
            'completed_at' => optional($this->completed_at)?->toIso8601String(),
        ];
    }
}
