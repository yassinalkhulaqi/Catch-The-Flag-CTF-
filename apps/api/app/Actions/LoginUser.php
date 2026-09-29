<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class LoginUser
{
    /**
     * @param  array{email:string,password:string}  $credentials
     * @return array{user:User,token:string,expires_at:Carbon}
     */
    public function handle(array $credentials): array
    {
        $user = User::query()->where('email', $credentials['email'])->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->isBanned()) {
            abort(response()->json([
                'error' => [
                    'code' => 'account_banned',
                    'message' => 'This account has been suspended.',
                ],
            ], 403));
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $expiresAt = now()->addDays((int) config('ctf.tokens.ttl_days', 30));
        $abilities = $user->isModerator() ? ['*', 'admin'] : ['*'];
        $newToken = $user->createToken('api', $abilities, $expiresAt);

        return [
            'user' => $user->fresh(),
            'token' => $newToken->plainTextToken,
            'expires_at' => $expiresAt,
        ];
    }
}
