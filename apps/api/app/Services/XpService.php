<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\XpReason;
use App\Models\User;
use App\Models\XpTransaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class XpService
{
    /**
     * Award XP idempotently for a reason+reference pair.
     * Returns the ledger row (existing or newly created).
     */
    public function award(User $user, int $amount, XpReason $reason, ?Model $reference = null, ?string $note = null): ?XpTransaction
    {
        if ($amount === 0 && $reason !== XpReason::AdminAdjustment) {
            return null;
        }

        $referenceType = $reference ? $reference->getMorphClass() : null;
        $referenceId = $reference?->getKey();

        if ($referenceType !== null && $referenceId !== null && $reason !== XpReason::AdminAdjustment) {
            $existing = XpTransaction::query()
                ->where('user_id', $user->id)
                ->where('reason', $reason->value)
                ->where('reference_type', $referenceType)
                ->where('reference_id', $referenceId)
                ->first();

            if ($existing !== null) {
                return $existing;
            }
        }

        return DB::transaction(function () use ($user, $amount, $reason, $referenceType, $referenceId, $note): XpTransaction {
            $locked = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            if ($referenceType !== null && $referenceId !== null && $reason !== XpReason::AdminAdjustment) {
                $existing = XpTransaction::query()
                    ->where('user_id', $locked->id)
                    ->where('reason', $reason->value)
                    ->where('reference_type', $referenceType)
                    ->where('reference_id', $referenceId)
                    ->first();

                if ($existing !== null) {
                    return $existing;
                }
            }

            $tx = XpTransaction::query()->create([
                'user_id' => $locked->id,
                'amount' => $amount,
                'reason' => $reason->value,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'note' => $note,
                'created_at' => now(),
            ]);

            $newXp = max(0, (int) $locked->xp + $amount);
            $locked->forceFill(['xp' => $newXp])->save();
            $user->xp = $newXp;

            return $tx;
        });
    }
}
