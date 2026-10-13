<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;

/**
 * Database notification row. Payload is UI copy only (docs/database.md §9).
 *
 * @mixin DatabaseNotification
 */
class NotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = (array) $this->data;

        return [
            'id' => (string) $this->id,
            'type' => $this->type,
            'data' => [
                'title' => (string) ($data['title'] ?? ''),
                'body' => isset($data['body']) ? (string) $data['body'] : null,
                'url' => isset($data['url']) ? (string) $data['url'] : null,
            ],
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
