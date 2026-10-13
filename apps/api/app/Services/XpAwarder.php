<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\XpReason;
use App\Models\User;
use App\Models\XpTransaction;

/**
 * Single choke point for minting XP. Every award writes the ledger row
 * and mirrors users.xp in the same (outer) transaction — callers never
 * touch counters directly.
 */
class XpAwarder
{
    public function award(
        User $user,
        int $amount,
        XpReason $reason,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $note = null,
    ): XpTransaction {
        $transaction = XpTransaction::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'reason' => $reason,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'note' => $note !== null ? substr($note, 0, 200) : null,
        ]);

        $user->increment('xp', $amount);

        return $transaction;
    }
}
