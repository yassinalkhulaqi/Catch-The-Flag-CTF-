<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Every write is idempotent (firstOrCreate / updateOrCreate) so
     * repeated runs — local dev, CI, fresh deploys — never fail.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
            ],
        );

        // Dependency order matters: challenges need categories, tags, and
        // the admin author; achievements resolve category ids; paths link
        // challenges. Every seeder is idempotent — repeated runs converge.
        $this->call([
            AdminSeeder::class,
            CategorySeeder::class,
            TagSeeder::class,
            ChallengeSeeder::class,
            WebSecuritySeeder::class,
            AchievementSeeder::class,
            PathSeeder::class,
        ]);
    }
}
