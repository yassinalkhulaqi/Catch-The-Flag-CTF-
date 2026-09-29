<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChallengeFileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => (int) $this->size_bytes,
            'checksum_sha256' => $this->checksum_sha256,
            'download_url' => url('/api/v1/challenges/'.$this->challenge_id.'/files/'.$this->id),
        ];
    }
}
