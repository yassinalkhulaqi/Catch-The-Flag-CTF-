<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SolveResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'challenge' => new ChallengeSummaryResource($this->whenLoaded('challenge')),
            'points_awarded' => (int) $this->points_awarded,
            'hints_used' => (int) $this->hints_used,
            'solved_at' => optional($this->solved_at)?->toIso8601String(),
        ];
    }
}
