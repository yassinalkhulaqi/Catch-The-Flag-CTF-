<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaderboardEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'rank' => (int) ($this->rank ?? 0),
            'id' => $this->id,
            'name' => $this->name,
            'xp' => (int) $this->xp,
            'solved_count' => (int) $this->solved_count,
            'achievements_count' => (int) ($this->achievements_count ?? 0),
        ];
    }
}
