<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HintUnlock extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'challenge_id',
        'hint_id',
        'points_cost',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'points_cost' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function hint(): BelongsTo
    {
        return $this->belongsTo(ChallengeHint::class, 'hint_id');
    }
}
