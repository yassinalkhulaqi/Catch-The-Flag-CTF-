<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class XpTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reason = $this->reason;
        $reasonValue = is_object($reason) ? $reason->value : (string) $reason;
        $description = is_object($reason) ? $reason->description() : $reasonValue;

        return [
            'id' => $this->id,
            'amount' => (int) $this->amount,
            'reason' => $reasonValue,
            'description' => $this->note ?: $description,
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}
