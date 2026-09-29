<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Path extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'summary',
        'description',
        'thumbnail_path',
        'category_id',
        'difficulty',
        'estimated_minutes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'difficulty' => Difficulty::class,
            'status' => ContentStatus::class,
            'estimated_minutes' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'id';
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

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(PathModule::class)->orderBy('position');
    }

    public function lessons(): HasManyThrough
    {
        return $this->hasManyThrough(Lesson::class, PathModule::class, 'path_id', 'module_id');
    }

    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(
            Path::class,
            'path_prerequisites',
            'path_id',
            'prerequisite_path_id'
        );
    }

    public function dependents(): BelongsToMany
    {
        return $this->belongsToMany(
            Path::class,
            'path_prerequisites',
            'prerequisite_path_id',
            'path_id'
        );
    }

    public function progressRows(): HasMany
    {
        return $this->hasMany(UserPathProgress::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published);
    }

    public function scopeSearch(Builder $query, string $q): Builder
    {
        return $query->whereRaw("search_vector @@ plainto_tsquery('simple', ?)", [$q]);
    }

    public function thumbnailUrl(): ?string
    {
        if ($this->thumbnail_path === null) {
            return null;
        }

        return asset('storage/'.$this->thumbnail_path);
    }
}
