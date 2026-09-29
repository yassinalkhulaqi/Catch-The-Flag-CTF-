<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\XpReason;
use App\Models\User;
use App\Models\XpTransaction;
use App\Services\AuditLogger;
use App\Services\XpService;

final class AdjustUserXpAction
{
    public function __construct(
        private XpService $xp,
        private AuditLogger $audit,
    ) {}

    public function handle(User $actor, User $target, int $amount, string $reasonNote): XpTransaction
    {
        $tx = $this->xp->award(
            $target,
            $amount,
            XpReason::AdminAdjustment,
            null,
            $reasonNote,
        );

        $this->audit->log($actor, 'user.xp_adjust', $target, [
            'amount' => $amount,
            'note' => $reasonNote,
            'xp_after' => (int) $target->fresh()->xp,
        ]);

        return $tx;
    }
}
