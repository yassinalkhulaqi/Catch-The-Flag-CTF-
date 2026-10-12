<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;

/**
 * Password reset + profile mutations. Token revocation keeps the caller's
 * current session alive where the docs require it.
 */
class PasswordAction
{
    /**
     * Always succeeds from the caller's perspective (no account enumeration).
     */
    public function sendResetLink(string $email): void
    {
        Password::sendResetLink(['email' => $email]);
    }

    /**
     * Consume a single-use reset token. Returns true on success.
     *
     * @param  array{token: string, email: string, password: string}  $validated
     */
    public function resetPassword(array $validated): bool
    {
        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                DB::transaction(function () use ($user, $password): void {
                    $user->forceFill([
                        'password' => Hash::make($password),
                        'remember_token' => null,
                    ])->save();

                    $user->tokens()->delete();
                });
            }
        );

        return $status === Password::PASSWORD_RESET;
    }

    /**
     * Change password; revoke every token except the current session.
     */
    public function updatePassword(User $user, string $newPassword): void
    {
        DB::transaction(function () use ($user, $newPassword): void {
            $user->forceFill(['password' => Hash::make($newPassword)])->save();

            $current = $user->currentAccessToken();

            $user->tokens()
                ->when($current !== null, fn ($query) => $query->where('id', '!=', $current->id))
                ->delete();
        });
    }

    /**
     * Update display profile. Avatar uploads are validated by
     * UpdateProfileRequest and stored under a server-generated key.
     *
     * @param  array{name?: string, bio?: string|null}  $validated
     */
    public function updateProfile(User $user, array $validated, mixed $avatar = null): User
    {
        return DB::transaction(function () use ($user, $validated, $avatar): User {
            if ($avatar !== null) {
                $key = 'avatars/'.str()->uuid().'.'.$avatar->extension();

                $avatar->storeAs('', $key, 'public');

                if ($user->avatar_path !== null) {
                    Storage::disk('public')->delete($user->avatar_path);
                }

                $user->avatar_path = $key;
            }

            $user->fill($validated)->save();

            return $user->refresh();
        });
    }
}
