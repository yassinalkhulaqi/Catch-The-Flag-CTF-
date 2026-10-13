<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * File metadata only. The storage_key is server-generated and must never
 * leave the server except through the authorized streaming download
 * endpoint (docs/security.md §6).
 */
class ChallengeFile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'challenge_id',
        'original_name',
        'storage_disk',
        'mime_type',
        'size_bytes',
        'checksum_sha256',
        'visibility',
    ];

    /** @var list<string> */
    protected $hidden = [
        'storage_key',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    /** @return BelongsTo<Challenge, $this> */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }
}
