<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'actor_id' => $this->actor_id,
            'actor' => $this->whenLoaded('actor', fn () => $this->actor ? [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
            ] : null),
            'action' => $this->action,
            'auditable_type' => $this->auditable_type,
            'auditable_id' => $this->auditable_id,
            'changes' => $this->changes,
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}
