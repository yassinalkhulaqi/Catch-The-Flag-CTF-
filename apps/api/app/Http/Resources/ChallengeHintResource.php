<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChallengeHintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $unlocked = (bool) ($this->unlocked ?? false);

        return [
            'id' => $this->id,
            'position' => (int) $this->position,
            'cost_points' => (int) $this->cost_points,
            'unlocked' => $unlocked,
            'content' => $this->when($unlocked, $this->content),
        ];
    }
}
