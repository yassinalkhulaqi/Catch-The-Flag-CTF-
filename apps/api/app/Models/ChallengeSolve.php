<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per user+challenge (UNIQUE(challenge_id, user_id) is the
 * final duplicate-solve guard). Counters and XP mirror this row
 * transactionally — never written from client input
 * (docs/database.md §6–7). Append-only: no updated_at column.
 */
class ChallengeSolve extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'challenge_id',
        'user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points_awarded' => 'integer',
            'hints_used' => 'integer',
            'solved_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Challenge, $this> */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
