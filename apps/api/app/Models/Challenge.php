<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use App\Enums\FlagValidationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Challenge extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'scenario',
        'category_id',
        'difficulty',
        'points',
        'estimated_minutes',
        'flag_validation_type',
        'max_attempts',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'difficulty' => Difficulty::class,
            'status' => ContentStatus::class,
            'flag_validation_type' => FlagValidationType::class,
            'points' => 'integer',
            'estimated_minutes' => 'integer',
            'solve_count' => 'integer',
            'max_attempts' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    /**
     * Learner-visible scope: only published challenges (docs/database.md §6).
     *
     * @param  Builder<Challenge>  $query
     * @return Builder<Challenge>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published->value);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** @return BelongsToMany<Tag, $this> */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'challenge_tag');
    }

    /** @return HasMany<ChallengeFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(ChallengeFile::class);
    }

    /** @return HasMany<ChallengeHint, $this> */
    public function hints(): HasMany
    {
        return $this->hasMany(ChallengeHint::class)->orderBy('position')->orderBy('id');
    }

    /** @return HasMany<ChallengeFlag, $this> */
    public function flags(): HasMany
    {
        return $this->hasMany(ChallengeFlag::class);
    }

    /** @return HasMany<ChallengeSubmission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(ChallengeSubmission::class);
    }

    /** @return HasMany<ChallengeSolve, $this> */
    public function solves(): HasMany
    {
        return $this->hasMany(ChallengeSolve::class);
    }

    /** @return BelongsToMany<Lesson, $this> */
    public function lessons(): BelongsToMany
    {
        return $this->belongsToMany(Lesson::class, 'lesson_challenge');
    }
}
