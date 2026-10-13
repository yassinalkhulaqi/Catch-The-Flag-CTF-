<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\ContentStatus;
use App\Models\Challenge;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Publish-workflow transitions for challenges (docs/api.md §5).
 * Endpoint names map literally to statuses: publish→published,
 * unpublish→draft, archive→archived, review→review.
 */
class TransitionChallengeAction
{
    use TransitionsContent;

    public function execute(User $actor, Challenge $challenge, ContentStatus $to, Request $request): Challenge
    {
        /** @var Challenge */
        return $this->transition($actor, $challenge, $to, $request, 'challenge');
    }
}
