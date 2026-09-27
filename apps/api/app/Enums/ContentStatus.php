<?php

namespace App\Enums;

enum ContentStatus: string
{
    case Draft = 'draft';
    case Review = 'review';
    case Published = 'published';
    case Archived = 'archived';

    /** Statuses visible to learners. */
    public function isVisible(): bool
    {
        return $this === self::Published;
    }

    /** Allowed next states (publishing workflow, docs/api.md §5). */
    public function transitions(): array
    {
        return match ($this) {
            self::Draft => [self::Review, self::Published, self::Archived],
            self::Review => [self::Draft, self::Published, self::Archived],
            self::Published => [self::Archived, self::Review],
            self::Archived => [self::Draft],
        };
    }
}
