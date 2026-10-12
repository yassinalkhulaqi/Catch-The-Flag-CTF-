<?php

declare(strict_types=1);

namespace App\Actions\Auth\Concerns;

use App\Models\User;

/**
 * Issue Sanctum personal access tokens with the platform TTL.
 *
 * @see config/ctf.php tokens.ttl_days
 */
trait IssuesApiTokens
{
    /**
     * @return array{user: User, token: string, expires_at: string}
     */
    protected function issueToken(User $user): array
    {
        $expiresAt = now()->addDays((int) config('ctf.tokens.ttl_days'));

        $token = $user->createToken('web', ['*'], $expiresAt);

        return [
            'user' => $user,
            'token' => $token->plainTextToken,
            'expires_at' => $expiresAt->toISOString(),
        ];
    }
}
