<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Data-driven taxonomy (docs/database.md §3). New categories are pure
 * data — no code change required to add one.
 */
class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'icon',
        'sort_order',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<Challenge, $this> */
    public function challenges(): HasMany
    {
        return $this->hasMany(Challenge::class);
    }

    /** @return HasMany<Path, $this> */
    public function paths(): HasMany
    {
        return $this->hasMany(Path::class);
    }
}
