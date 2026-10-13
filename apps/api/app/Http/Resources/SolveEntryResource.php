<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ChallengeSolve;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One historical solve of the authenticated user.
 *
 * @mixin ChallengeSolve
 */
class SolveEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'challenge' => new ChallengeSummaryResource($this->whenLoaded('challenge')),
            'points_awarded' => (int) $this->points_awarded,
            'hints_used' => (int) $this->hints_used,
            'solved_at' => $this->solved_at?->toISOString(),
        ];
    }
}
