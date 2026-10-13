<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\XpReason;
use App\Models\XpTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One XP ledger row. Descriptions come from the XpReason enum —
 * the free-text note column is never exposed raw.
 *
 * @mixin XpTransaction
 */
class XpEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reason = $this->reason instanceof XpReason ? $this->reason : XpReason::tryFrom((string) $this->reason);

        return [
            'id' => $this->id,
            'amount' => (int) $this->amount,
            'reason' => $reason?->value ?? (string) $this->reason,
            'description' => $reason?->description() ?? (string) $this->reason,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
