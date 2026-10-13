<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChallengeHint extends Model
{
    use HasFactory;

    protected $fillable = [
        'challenge_id',
        'content',
        'cost_points',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cost_points' => 'integer',
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<Challenge, $this> */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    /** @return HasMany<HintUnlock, $this> */
    public function unlocks(): HasMany
    {
        return $this->hasMany(HintUnlock::class, 'hint_id');
    }
}
