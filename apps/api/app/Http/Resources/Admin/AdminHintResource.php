<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ChallengeHint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff hint shape: full content (authoring view). Learners only see
 * hints through the unlock endpoint.
 *
 * @mixin ChallengeHint
 */
class AdminHintResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'challenge_id' => $this->challenge_id,
            'content' => $this->content,
            'cost_points' => (int) $this->cost_points,
            'position' => (int) $this->position,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
