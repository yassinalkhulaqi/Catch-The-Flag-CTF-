<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\ContentStatus;
use App\Models\Path;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Publish-workflow transitions for learning paths. Same endpoint
 * pattern as challenges (docs/api.md §5).
 */
class TransitionPathAction
{
    use TransitionsContent;

    public function execute(User $actor, Path $path, ContentStatus $to, Request $request): Path
    {
        /** @var Path */
        return $this->transition($actor, $path, $to, $request, 'path');
    }
}
