<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Records a hint reveal. Idempotent per UNIQUE(user_id, hint_id):
 * unlocking twice changes nothing (docs/database.md §6). Append-only:
 * no updated_at column.
 */
class HintUnlock extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'challenge_id',
        'hint_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points_cost' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Challenge, $this> */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    /** @return BelongsTo<ChallengeHint, $this> */
    public function hint(): BelongsTo
    {
        return $this->belongsTo(ChallengeHint::class, 'hint_id');
    }
}
