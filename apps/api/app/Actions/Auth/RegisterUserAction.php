<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Auth\Concerns\IssuesApiTokens;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Register a new account and issue its first API token.
 */
class RegisterUserAction
{
    use IssuesApiTokens;

    /**
     * @param  array{name: string, email: string, password: string}  $validated
     * @return array{user: User, token: string, expires_at: string}
     */
    public function execute(array $validated): array
    {
        return DB::transaction(function () use ($validated): array {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            return $this->issueToken($user);
        });
    }
}
