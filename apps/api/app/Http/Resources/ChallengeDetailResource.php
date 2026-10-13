<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Challenge;
use App\Models\ChallengeSolve;
use App\Models\HintUnlock;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Challenge detail (docs/api.md §3). Security-critical shape:
 * flag material (ciphertext, hash, plaintext) NEVER appears here,
 * file rows expose metadata plus the authorized download URL but
 * never the storage_key, and hint rows expose position/cost/state
 * but never content (content is served only by the unlock endpoint).
 *
 * @mixin Challenge
 */
class ChallengeDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user('sanctum');
        $viewerId = $viewer !== null ? (int) $viewer->id : null;

        $unlockedHintIds = $viewerId !== null ? $this->unlockedHintIds($viewerId) : [];
        $unlockCost = $viewerId !== null ? $this->unlockCost($viewerId) : 0;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'scenario' => $this->scenario,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'difficulty' => $this->difficulty->value,
            'points' => (int) $this->points,
            'estimated_minutes' => (int) $this->estimated_minutes,
            'status' => $this->status->value,
            'published_at' => $this->published_at?->toISOString(),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'files' => $this->whenLoaded('files', function () {
                return $this->files->map(fn ($file): array => [
                    'id' => $file->id,
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size_bytes' => (int) $file->size_bytes,
                    'url' => "/api/v1/challenges/{$this->id}/files/{$file->id}",
                ])->values()->all();
            }),
            'hints' => $this->whenLoaded('hints', function () use ($unlockedHintIds) {
                return $this->hints->map(fn ($hint): array => [
                    'id' => $hint->id,
                    'position' => (int) $hint->position,
                    'cost_points' => (int) $hint->cost_points,
                    'unlocked' => in_array($hint->id, $unlockedHintIds, true),
                ])->values()->all();
            }),
            'author_name' => $this->whenLoaded('author', fn () => $this->author?->name),
            'solve_count' => (int) $this->solve_count,
            'solved' => $this->when($viewerId !== null, fn (): bool => $this->isSolvedBy($viewerId)),
            'points_remaining' => max(0, (int) $this->points - $unlockCost),
            'related' => ChallengeSummaryResource::collection($this->relatedChallenges()),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * @return list<int>
     */
    private function unlockedHintIds(int $userId): array
    {
        return HintUnlock::query()
            ->where('user_id', $userId)
            ->where('challenge_id', $this->id)
            ->pluck('hint_id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
    }

    private function unlockCost(int $userId): int
    {
        return (int) HintUnlock::query()
            ->where('user_id', $userId)
            ->where('challenge_id', $this->id)
            ->sum('points_cost');
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

    /**
     * Same-category published siblings, most-solved first.
     *
     * @return Collection<int, Challenge>
     */
    private function relatedChallenges(): Collection
    {
        return Challenge::query()
            ->published()
            ->where('category_id', $this->category_id)
            ->where('id', '!=', $this->id)
            ->orderByDesc('solve_count')
            ->orderBy('id')
            ->limit(5)
            ->get();
    }
}
