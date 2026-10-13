<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One ranked leaderboard row. Only public fields: name, xp,
 * solved_count (docs/security.md §10 — no user enumeration beyond this).
 *
 * @mixin User
 */
class LeaderboardEntryResource extends JsonResource
{
    public function __construct($resource, private readonly int $rank)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'rank' => $this->rank,
            'id' => $this->id,
            'name' => $this->name,
            'xp' => (int) $this->xp,
            'solved_count' => (int) $this->solved_count,
        ];
    }
}
