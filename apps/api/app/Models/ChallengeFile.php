<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChallengeFile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'challenge_id',
        'original_name',
        'storage_disk',
        'storage_key',
        'mime_type',
        'size_bytes',
        'checksum_sha256',
        'visibility',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }
}
