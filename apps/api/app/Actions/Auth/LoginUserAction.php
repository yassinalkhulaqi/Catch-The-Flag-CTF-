<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Auth\Concerns\IssuesApiTokens;
use App\Exceptions\AccountBannedException;
use App\Models\User;
use App\Services\LoginThrottle;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Authenticate credentials and issue an API token.
 *
 * Errors are deliberately generic: unknown email and wrong password
 * produce the identical response (docs/security.md §2). Repeated failures
 * against one account lock it for a window (progressive, self-healing) and
 * are logged by account hash, never by raw email.
 */
class LoginUserAction
{
    use IssuesApiTokens;

    public function __construct(private readonly LoginThrottle $throttle) {}

    /**
     * @param  string|null  $userAgent  Client User-Agent (optional; used to name the session).
     * @return array{user: User, token: string, expires_at: string}
     *
     * @throws ValidationException
     * @throws AccountBannedException
     * @throws TooManyRequestsHttpException
     */
    public function execute(string $email, string $password, ?string $userAgent = null): array
    {
        $normalizedEmail = strtolower(trim($email));

        if ($this->throttle->tooManyAttempts($normalizedEmail)) {
            $retryAfter = $this->throttle->availableIn($normalizedEmail);

            Log::warning('Blocked login to a locked account', [
                'account_hash' => substr(hash('sha256', $normalizedEmail), 0, 16),
                'retry_after' => $retryAfter,
            ]);

            throw new TooManyRequestsHttpException($retryAfter, 'Too many failed attempts. Try again later.');
        }

        $user = User::where('email', $normalizedEmail)->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            $this->throttle->hit($normalizedEmail);

            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if ($user->isBanned()) {
            throw new AccountBannedException;
        }

        $this->throttle->clear($normalizedEmail);

        return DB::transaction(function () use ($user, $userAgent): array {
            $user->forceFill(['last_login_at' => now()])->save();

            return $this->issueToken($user, $userAgent);
        });
    }
}
