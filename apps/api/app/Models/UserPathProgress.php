<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PathProgressStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPathProgress extends Model
{
    protected $table = 'user_path_progress';

    protected $fillable = [
        'user_id',
        'path_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => PathProgressStatus::class,
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Path, $this> */
    public function path(): BelongsTo
    {
        return $this->belongsTo(Path::class);
    }
}
