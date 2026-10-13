<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Explicit "mark complete" row per user+lesson (UNIQUE(user_id,
 * lesson_id)). Written only by application actions, never from
 * client-supplied booleans (docs/database.md §8).
 */
class LessonCompletion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'lesson_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Lesson, $this> */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
