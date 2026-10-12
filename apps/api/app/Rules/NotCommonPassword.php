<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Reject widely-abused passwords (docs/security.md §2).
 * Complements min-length; not a substitute for breach-corpus checks.
 */
class NotCommonPassword implements ValidationRule
{
    /** @var array<int, string> */
    private const DENYLIST = [
        'password', 'password1', 'password12', 'password123',
        '12345678', '123456789', '1234567890', 'qwerty123',
        'letmein123', 'welcome123', 'admin12345', 'changeme12',
        'iloveyou12', 'football12', 'monkey1234', 'dragon1234',
        'sunshine12', 'master1234', 'shadow1234', 'superman12',
        'michael12', 'jesus12345', 'princess12', 'qwertyuiop',
        '1q2w3e4r5t', 'ctfpassword', 'catchtheflag', 'flaghunter',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        if (in_array(strtolower($value), self::DENYLIST, true)) {
            $fail('The :attribute is too common. Choose a less predictable password.');
        }
    }
}
