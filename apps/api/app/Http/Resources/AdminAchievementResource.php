<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff authoring payload. Learner AchievementResource intentionally omits
 * criteria, points, and catalog flags.
 */
class AdminAchievementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'title' => $this->title,
            'description' => $this->description,
            'icon' => $this->icon,
            'criteria' => $this->criteria,
            'points' => (int) $this->points,
            'is_active' => (bool) $this->is_active,
            'sort_order' => (int) $this->sort_order,
            'awarded_count' => (int) ($this->awarded_count ?? 0),
        ];
    }
}
