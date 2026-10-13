<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\XpReason;
use App\Models\User;
use App\Models\XpTransaction;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Manual XP adjustment. A reason string is mandatory and lands in the
 * ledger note; the append-only xp_transactions row (reason
 * admin_adjustment) is written in the same transaction as the
 * denormalized users.xp increment, so the two can never diverge.
 * Adjustments that would drive the balance below zero are 422.
 */
class AdjustXpAction
{
    public function execute(User $actor, User $target, int $amount, string $reason, Request $request): User
    {
        return DB::transaction(function () use ($actor, $target, $amount, $reason, $request): User {
            if ($amount === 0) {
                throw new HttpException(422, 'Adjustment amount must not be zero.');
            }

            $before = (int) $target->xp;
            $after = $before + $amount;

            if ($after < 0) {
                throw new HttpException(422, 'Adjustment would drive the XP balance below zero.');
            }

            XpTransaction::create([
                'user_id' => $target->id,
                'amount' => $amount,
                'reason' => XpReason::AdminAdjustment,
                'reference_type' => User::class,
                'reference_id' => $actor->id,
                'note' => $reason,
            ]);

            $target->increment('xp', $amount);

            AuditLogger::log(
                $actor,
                'user.xp_adjusted',
                User::class,
                $target->id,
                ['before' => ['xp' => $before], 'after' => ['xp' => $after, 'amount' => $amount, 'reason' => $reason]],
                $request,
            );

            return $target->refresh();
        });
    }
}
