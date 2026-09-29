<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Admin-only — never includes flag value/ciphertext/hash. */
class ChallengeFlagResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'case_sensitive' => (bool) $this->case_sensitive,
            'is_active' => (bool) $this->is_active,
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}
