<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChallengeDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $base = (new ChallengeSummaryResource($this))->toArray($request);

        return array_merge($base, [
            'description' => $this->description,
            'scenario' => $this->scenario,
            'files' => ChallengeFileResource::collection($this->whenLoaded('files')),
            'hints' => ChallengeHintResource::collection($this->whenLoaded('hints')),
            'author' => $this->whenLoaded('author', fn () => $this->author ? [
                'id' => $this->author->id,
                'name' => $this->author->name,
            ] : null),
            'published_at' => optional($this->published_at)?->toIso8601String(),
            'points_remaining' => (int) ($this->points_remaining ?? $this->points),
            'related' => ChallengeSummaryResource::collection($this->whenLoaded('related')),
        ]);
    }
}
