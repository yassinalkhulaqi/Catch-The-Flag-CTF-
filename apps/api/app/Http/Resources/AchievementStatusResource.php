<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Achievement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Achievement with the viewer's progress toward locked rows.
 *
 * @mixin Achievement
 */
class AchievementStatusResource extends JsonResource
{
    /**
     * @param  array{current: int, target: int}|null  $progress
     */
    public function __construct($resource, private readonly bool $awarded, private readonly ?string $awardedAt, private readonly ?array $progress = null)
    {
        parent::__construct($resource);
    }

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
            'awarded' => $this->awarded,
            'awarded_at' => $this->awardedAt,
            'progress' => $this->progress,
        ];
    }
}
