<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'slug',
        'summary',
        'content',
        'position',
        'estimated_minutes',
        'is_published',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'estimated_minutes' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    /** @return BelongsTo<PathModule, $this> */
    public function module(): BelongsTo
    {
        return $this->belongsTo(PathModule::class, 'module_id');
    }

    /** @return BelongsToMany<Challenge, $this> */
    public function challenges(): BelongsToMany
    {
        return $this->belongsToMany(Challenge::class, 'lesson_challenge');
    }

    /** @return HasMany<LessonCompletion, $this> */
    public function completions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    /** @return HasMany<Quiz, $this> */
    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class, 'lesson_id')->orderBy('position')->orderBy('id');
    }
}
