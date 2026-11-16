<?php

declare(strict_types=1);

namespace App\Actions\Auth\Concerns;

use App\Models\User;
use App\Services\UserAgent;

/**
 * Issue Sanctum personal access tokens with the platform TTL.
 *
 * The session name is derived from the client's User-Agent (see
 * App\Services\UserAgent) so a session list is meaningful to its owner;
 * it never reaches anyone but the user themselves.
 *
 * @see config/ctf.php tokens.ttl_days
 */
trait IssuesApiTokens
{
    /**
     * @param  string|null  $name  Session name (User-Agent string, sanitized); defaults to "web".
     * @return array{user: User, token: string, expires_at: string}
     */
    protected function issueToken(User $user, ?string $name = null): array
    {
        $expiresAt = now()->addDays((int) config('ctf.tokens.ttl_days'));

        $token = $user->createToken(
            UserAgent::sanitize($name),
            ['*'],
            $expiresAt,
        );

        return [
            'user' => $user,
            'token' => $token->plainTextToken,
            'expires_at' => $expiresAt->toISOString(),
        ];
    }
}
