<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role?->value ?? $this->role,
            'xp' => (int) $this->xp,
            'solved_count' => (int) $this->solved_count,
            'bio' => $this->bio,
            'avatar_url' => $this->avatarUrl(),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'achievements_count' => $this->when(isset($this->achievements_count) || $this->relationLoaded('userAchievements'),
                fn () => (int) ($this->achievements_count ?? $this->userAchievements->count())
            ),
            'banned_at' => $this->when($request->user()?->isAdmin(), optional($this->banned_at)?->toIso8601String()),
        ];
    }
}
