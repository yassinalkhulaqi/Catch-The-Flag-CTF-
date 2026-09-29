<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AchievementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'title' => $this->title,
            'description' => $this->description,
            'icon' => $this->icon,
            'awarded' => (bool) ($this->awarded ?? false),
            'awarded_at' => $this->awarded_at ?? null,
            'progress' => $this->when(isset($this->progress), $this->progress),
        ];
    }
}
