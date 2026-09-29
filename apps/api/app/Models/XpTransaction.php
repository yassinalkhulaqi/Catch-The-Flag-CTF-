<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\XpReason;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class XpTransaction extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'amount',
        'reason',
        'reference_type',
        'reference_id',
        'note',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'reason' => XpReason::class,
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }
}
