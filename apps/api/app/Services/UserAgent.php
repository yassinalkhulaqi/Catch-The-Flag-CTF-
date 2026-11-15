<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Sanitize a client-supplied User-Agent into a safe session name.
 *
 * The raw header is attacker-controlled. It is only ever used as a label
 * shown back to the same user, but control characters are stripped and the
 * string is length-capped before it is stored.
 */
final class UserAgent
{
    /**
     * Printable text only, single-line, at most 80 characters.
     */
    public static function sanitize(?string $userAgent): string
    {
        $value = trim((string) $userAgent);

        if ($value === '') {
            return 'web';
        }

        $value = str_replace(["\r", "\n"], ' ', $value);
        $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?? '';
        $value = preg_replace('/\s+/u', ' ', $value) ?? '';
        $value = trim($value);

        if ($value === '') {
            return 'web';
        }

        return mb_substr($value, 0, 80);
    }
}
