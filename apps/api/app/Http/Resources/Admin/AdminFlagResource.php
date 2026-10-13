<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ChallengeFlag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Write-only flag metadata. Only identity/state fields are exposed —
 * ciphertext, hash, and plaintext can never appear here (the model
 * also hides them, defense in depth).
 *
 * @mixin ChallengeFlag
 */
class AdminFlagResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'challenge_id' => $this->challenge_id,
            'label' => $this->label,
            'case_sensitive' => (bool) $this->case_sensitive,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
