<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Immutable audit log of flag attempts. Only the HMAC of the submitted
 * value is stored — plaintext flags are never persisted
 * (docs/database.md §6). Append-only: no updated_at column.
 */
class ChallengeSubmission extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'challenge_id',
        'user_id',
        'is_correct',
        'ip_address',
        'user_agent',
    ];

    /** @var list<string> */
    protected $hidden = [
        'flag_hash',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
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
