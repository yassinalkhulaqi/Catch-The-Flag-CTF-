<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChallengeFlag extends Model
{
    use HasFactory;

    protected $fillable = [
        'challenge_id',
        'label',
        'case_sensitive',
        'is_active',
    ];

    protected $hidden = [
        'flag_ciphertext',
        'flag_hash',
    ];

    protected function casts(): array
    {
        return [
            'case_sensitive' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
