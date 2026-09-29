<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChallengeSubmission extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'challenge_id',
        'user_id',
        'flag_hash',
        'is_correct',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $hidden = [
        'flag_hash',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
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
