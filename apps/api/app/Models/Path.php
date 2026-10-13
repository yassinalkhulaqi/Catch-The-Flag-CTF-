<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Path extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'summary',
        'description',
        'thumbnail_path',
        'category_id',
        'difficulty',
        'estimated_minutes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'difficulty' => Difficulty::class,
            'status' => ContentStatus::class,
            'estimated_minutes' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    /**
     * Learner-visible scope: only published paths (docs/database.md §4).
     *
     * @param  Builder<Path>  $query
     * @return Builder<Path>
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
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<PathModule, $this> */
    public function modules(): HasMany
    {
        return $this->hasMany(PathModule::class)->orderBy('position')->orderBy('id');
    }

    /** @return BelongsToMany<Path, $this> */
    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(Path::class, 'path_prerequisites', 'path_id', 'prerequisite_path_id');
    }

    /** @return BelongsToMany<Path, $this> */
    public function requiredBy(): BelongsToMany
    {
        return $this->belongsToMany(Path::class, 'path_prerequisites', 'prerequisite_path_id', 'path_id');
    }

    /** @return HasMany<UserPathProgress, $this> */
    public function progress(): HasMany
    {
        return $this->hasMany(UserPathProgress::class);
    }
}
