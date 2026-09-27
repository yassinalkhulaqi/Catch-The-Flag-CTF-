<?php

namespace App\Enums;

enum Role: string
{
    case User = 'user';
    case Moderator = 'moderator';
    case Admin = 'admin';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    public function isAtLeast(self $other): bool
    {
        return $this->rank() >= $other->rank();
    }

    private function rank(): int
    {
        return match ($this) {
            self::User => 0,
            self::Moderator => 1,
            self::Admin => 2,
        };
    }
}
