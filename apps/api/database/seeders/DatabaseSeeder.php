<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            TagSeeder::class,
            AchievementSeeder::class,
            AdminUserSeeder::class,
            DemoContentSeeder::class,
        ]);
    }
}
