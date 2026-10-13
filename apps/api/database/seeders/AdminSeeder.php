<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Platform administrator from SEED_ADMIN_* env vars (see .env.example).
 * Keyed on email; the privileged `role` field is assigned via forceFill
 * because it is intentionally not mass-assignable.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) (env('SEED_ADMIN_EMAIL') ?: 'admin@example.com');
        $name = (string) (env('SEED_ADMIN_NAME') ?: 'Admin');
        $password = (string) (env('SEED_ADMIN_PASSWORD') ?: 'ChangeMe-Admin-Passw0rd!');

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                // Plaintext here: the model's `hashed` cast hashes on assignment.
                'password' => $password,
            ],
        );

        if (! $admin->hasRole(Role::Admin)) {
            $admin->forceFill(['role' => Role::Admin->value])->save();
        }
    }
}
