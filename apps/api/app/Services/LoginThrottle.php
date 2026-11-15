<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\RateLimiter;

/**
 * Per-account login lockout (docs/security.md §2).
 *
 * Failed attempts are counted in the application cache keyed by the hashed
 * email — an unknown-email (possible attack on a non-existent account) and a
 * wrong password for a known one share the same counter, and the
 * caller cannot enumerate which accounts exist. The marker expires after the
 * configured window, so a lockout is always temporary and self-healing; it is
 * also clearable by an admin without a database write.
 *
 * The key is hashed: the cache never stores a bare email address.
 */
final class LoginThrottle
{
    private const PREFIX = 'ctf:login-attempts';

    /**
     * Lockout key for an account (sha256 of the normalized email).
     */
    public function key(string $email): string
    {
        return self::PREFIX.':'.hash('sha256', strtolower(trim($email)));
    }

    /**
     * The account is locked and may not attempt another login.
     */
    public function tooManyAttempts(string $email): bool
    {
        return RateLimiter::tooManyAttempts($this->key($email), $this->maxAttempts());
    }

    /**
     * Record a failed attempt.
     */
    public function hit(string $email): void
    {
        RateLimiter::hit($this->key($email), $this->decaySeconds());
    }

    /**
     * Clear the counter (used on a successful login and on admin unlock).
     */
    public function clear(string $email): void
    {
        RateLimiter::clear($this->key($email));
    }

    /**
     * Seconds until the window expires (reported as Retry-After).
     */
    public function availableIn(string $email): int
    {
        return RateLimiter::availableIn($this->key($email));
    }

    /**
     * Attempts recorded in the current window.
     */
    public function attempts(string $email): int
    {
        return RateLimiter::attempts($this->key($email));
    }

    private function maxAttempts(): int
    {
        return (int) config('ctf.security.lockout_max_attempts', 5);
    }

    private function decaySeconds(): int
    {
        return (int) config('ctf.security.login_attempts_window_minutes', 15) * 60;
    }
}
