<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A learner bookmark with an optional private note.
 *
 * `bookmarkable_type` values come from the morph map
 * (challenge | lesson | path — never a class name). Created and deleted
 * only through the bookmark endpoints.
 */
class Bookmark extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'bookmarkable_type',
        'bookmarkable_id',
        'note',
    ];

    /** @var list<string> */
    protected $hidden = [
        'user_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return MorphTo<Model, $this> */
    public function bookmarkable(): MorphTo
    {
        return $this->morphTo();
    }
}
