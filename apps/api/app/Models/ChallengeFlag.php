<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Accepted flags. Plaintext never exists on this model: only the
 * AES-GCM ciphertext and the keyed HMAC used for constant-time
 * comparison (docs/security.md §5). Both are hidden from every
 * serialization path — flags are write-only via dedicated admin
 * actions that use forceFill, never mass assignment.
 */
class ChallengeFlag extends Model
{
    use HasFactory;

    protected $fillable = [
        'challenge_id',
        'label',
        'case_sensitive',
        'is_active',
    ];

    /** @var list<string> */
    protected $hidden = [
        'flag_ciphertext',
        'flag_hash',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'case_sensitive' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Challenge, $this> */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }
}
