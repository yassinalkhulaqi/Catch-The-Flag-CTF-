<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\ContentStatus;
use App\Models\Path;
use App\Models\User;
use App\Services\AuditLogger;

final class PublishPathAction
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(User $actor, Path $path): Path
    {
        $from = $path->status?->value ?? (string) $path->status;
        $path->forceFill([
            'status' => ContentStatus::Published->value,
            'published_at' => $path->published_at ?? now(),
        ])->save();

        $this->audit->log($actor, 'path.publish', $path, [
            'before' => ['status' => $from],
            'after' => ['status' => ContentStatus::Published->value],
        ]);

        return $path->refresh();
    }
}
