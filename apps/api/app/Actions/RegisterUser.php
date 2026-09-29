<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class RegisterUser
{
    /**
     * @param  array{name:string,email:string,password:string}  $data
     * @return array{user:User,token:string,expires_at:Carbon}
     */
    public function handle(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $user = new User;
            $user->forceFill([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => Role::User->value,
                'xp' => 0,
                'solved_count' => 0,
            ])->save();

            $expiresAt = now()->addDays((int) config('ctf.tokens.ttl_days', 30));
            $newToken = $user->createToken('api', ['*'], $expiresAt);

            return [
                'user' => $user->fresh(),
                'token' => $newToken->plainTextToken,
                'expires_at' => $expiresAt,
            ];
        });
    }
}
