<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Http\Resources\TagResource;
use App\Models\Challenge;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff challenge shape: every scalar field plus workflow status, but
 * NEVER flag material (ciphertext/hash/plaintext). Drafts included.
 *
 * @mixin Challenge
 */
class AdminChallengeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'scenario' => $this->scenario,
            'category_id' => $this->category_id,
            'difficulty' => $this->difficulty->value,
            'points' => (int) $this->points,
            'estimated_minutes' => (int) $this->estimated_minutes,
            'flag_validation_type' => $this->flag_validation_type->value,
            'status' => $this->status->value,
            'published_at' => $this->published_at?->toISOString(),
            'author_id' => $this->author_id,
            'solve_count' => (int) $this->solve_count,
            'max_attempts' => $this->max_attempts,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'flags_count' => $this->whenCounted('flags'),
            'files_count' => $this->whenCounted('files'),
            'hints_count' => $this->whenCounted('hints'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
