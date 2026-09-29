<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('SEED_ADMIN_EMAIL', 'admin@example.com');
        $user = User::query()->firstOrNew(['email' => $email]);
        $user->forceFill([
            'name' => (string) env('SEED_ADMIN_NAME', 'Admin'),
            'email' => $email,
            'password' => Hash::make((string) env('SEED_ADMIN_PASSWORD', 'ChangeMe-Admin-Passw0rd!')),
            'role' => Role::Admin->value,
            'email_verified_at' => now(),
        ])->save();
    }
}
