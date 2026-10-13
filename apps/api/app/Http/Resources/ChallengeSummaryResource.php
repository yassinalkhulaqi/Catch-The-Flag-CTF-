<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Challenge;
use App\Models\ChallengeSolve;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Challenge card shape for listings (docs/api.md §3). The per-viewer
 * `solved` flag is included only for authenticated requests and is
 * pre-loaded by the search service to avoid N+1 queries.
 *
 * @mixin Challenge
 */
class ChallengeSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user('sanctum');

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'difficulty' => $this->difficulty->value,
            'points' => (int) $this->points,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'solve_count' => (int) $this->solve_count,
            'solved' => $this->when($viewer !== null, fn (): bool => $this->isSolvedBy((int) $viewer->id)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    private function isSolvedBy(int $userId): bool
    {
        if ($this->relationLoaded('solves')) {
            return $this->solves->isNotEmpty();
        }

        return ChallengeSolve::query()
            ->where('challenge_id', $this->id)
            ->where('user_id', $userId)
            ->exists();
    }
}
