<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Public user shape. Never includes password hashes, tokens, flags,
 * or internal paths (docs/security.md §4).
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'xp' => (int) $this->xp,
            'solved_count' => (int) $this->solved_count,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_path !== null
                ? Storage::disk('public')->url($this->avatar_path)
                : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
