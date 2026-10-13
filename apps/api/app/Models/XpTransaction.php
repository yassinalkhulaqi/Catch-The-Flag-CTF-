<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\XpReason;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only XP ledger. users.xp is a denormalized mirror maintained
 * transactionally alongside these rows — never from client input
 * (docs/architecture.md §8.3).
 */
class XpTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'amount',
        'reason',
        'reference_type',
        'reference_id',
        'note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'reason' => XpReason::class,
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
