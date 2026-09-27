<?php

namespace App\Enums;

/**
 * Extension point for future challenge types (docs/architecture.md §4.3).
 * V1 implements ONLY `static`.
 */
enum FlagValidationType: string
{
    case Static = 'static';
    case PerUser = 'per_user';
    case PerInstance = 'per_instance';
    case Dynamic = 'dynamic';

    public function isSupported(): bool
    {
        return $this === self::Static;
    }
}
