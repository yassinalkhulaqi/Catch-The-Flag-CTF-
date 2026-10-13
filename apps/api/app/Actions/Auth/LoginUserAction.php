<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Auth\Concerns\IssuesApiTokens;
use App\Exceptions\AccountBannedException;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Authenticate credentials and issue an API token.
 *
 * Errors are deliberately generic: unknown email and wrong password
 * produce the identical response (docs/security.md §2).
 */
class LoginUserAction
{
    use IssuesApiTokens;

    /**
     * @return array{user: User, token: string, expires_at: string}
     *
     * @throws ValidationException
     * @throws AccountBannedException
     */
    public function execute(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if ($user->isBanned()) {
            throw new AccountBannedException;
        }

        return DB::transaction(function () use ($user): array {
            $user->forceFill(['last_login_at' => now()])->save();

            return $this->issueToken($user);
        });
    }
}
