<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use App\Enums\FlagValidationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Challenge extends Model
{
    use HasFactory, SoftDeletes;

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
        'author_id',
        'max_attempts',
    ];

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

    public function resolveRouteBinding($value, $field = null)
    {
        if ($field !== null) {
            return $this->where($field, $value)->firstOrFail();
        }

        // PostgreSQL rejects non-numeric values against bigint id columns.
        if (ctype_digit((string) $value)) {
            return $this->where('id', (int) $value)->orWhere('slug', $value)->firstOrFail();
        }

        return $this->where('slug', $value)->firstOrFail();
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'challenge_tag');
    }

    public function lessons(): BelongsToMany
    {
        return $this->belongsToMany(Lesson::class, 'lesson_challenge');
    }

    public function flags(): HasMany
    {
        return $this->hasMany(ChallengeFlag::class);
    }

    public function hints(): HasMany
    {
        return $this->hasMany(ChallengeHint::class)->orderBy('position');
    }

    public function files(): HasMany
    {
        return $this->hasMany(ChallengeFile::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ChallengeSubmission::class);
    }

    public function solves(): HasMany
    {
        return $this->hasMany(ChallengeSolve::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published);
    }

    public function scopeSearch(Builder $query, string $q): Builder
    {
        return $query->whereRaw("search_vector @@ plainto_tsquery('simple', ?)", [$q]);
    }
}
