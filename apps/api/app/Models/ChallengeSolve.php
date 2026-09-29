<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChallengeSolve extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'challenge_id',
        'user_id',
        'points_awarded',
        'hints_used',
        'solved_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'points_awarded' => 'integer',
            'hints_used' => 'integer',
            'solved_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
