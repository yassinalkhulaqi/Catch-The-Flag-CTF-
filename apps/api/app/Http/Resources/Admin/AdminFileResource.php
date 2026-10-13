<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ChallengeFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff file metadata. Never exposes `storage_key` (server-generated
 * path — the model hides it too, defense in depth).
 *
 * @mixin ChallengeFile
 */
class AdminFileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'challenge_id' => $this->challenge_id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => (int) $this->size_bytes,
            'checksum_sha256' => $this->checksum_sha256,
            'visibility' => $this->visibility,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
