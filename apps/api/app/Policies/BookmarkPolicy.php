<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Bookmark;
use App\Models\User;

/**
 * Bookmarks are private to their author. Admin bypass is intentionally
 * absent — a bookmark list is learner data, never admin data.
 */
class BookmarkPolicy
{
    public function view(User $user, Bookmark $bookmark): bool
    {
        return $bookmark->user_id === $user->id;
    }

    public function update(User $user, Bookmark $bookmark): bool
    {
        return $bookmark->user_id === $user->id;
    }

    public function delete(User $user, Bookmark $bookmark): bool
    {
        return $bookmark->user_id === $user->id;
    }
}
