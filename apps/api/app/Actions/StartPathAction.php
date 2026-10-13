<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\PathProgressStatus;
use App\Models\Path;
use App\Models\User;
use App\Models\UserPathProgress;
use Illuminate\Support\Facades\DB;

/**
 * Idempotent path start: first call creates the progress row,
 * repeats return it unchanged.
 */
class StartPathAction
{
    public function execute(User $user, Path $path): UserPathProgress
    {
        return DB::transaction(function () use ($user, $path): UserPathProgress {
            $progress = UserPathProgress::query()
                ->where('user_id', $user->id)
                ->where('path_id', $path->id)
                ->first();

            if ($progress !== null) {
                return $progress;
            }

            return UserPathProgress::forceCreate([
                'user_id' => $user->id,
                'path_id' => $path->id,
                'status' => PathProgressStatus::InProgress,
                'started_at' => now(),
            ]);
        });
    }
}
