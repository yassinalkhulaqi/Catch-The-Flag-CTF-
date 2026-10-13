<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * The 6 V1 achievements. Keyed on the unique `key` column; the
 * crypto-master criteria resolves the crypto category id dynamically so
 * the seeder never hardcodes an auto-increment id.
 */
class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $cryptoId = Category::where('slug', 'crypto')->firstOrFail()->id;

        $achievements = [
            [
                'key' => 'first-solve',
                'title' => 'First Blood... almost',
                'description' => 'Solve your first challenge.',
                'icon' => 'flag',
                'criteria' => ['type' => 'solves_total', 'target' => 1],
                'points' => 50,
                'sort_order' => 10,
            ],
            [
                'key' => 'solver-10',
                'title' => 'Seasoned Solver',
                'description' => 'Solve 10 challenges.',
                'icon' => 'trophy',
                'criteria' => ['type' => 'solves_total', 'target' => 10],
                'points' => 150,
                'sort_order' => 20,
            ],
            [
                'key' => 'xp-1000',
                'title' => 'Rising Star',
                'description' => 'Earn 1000 total XP.',
                'icon' => 'star',
                'criteria' => ['type' => 'xp_total', 'target' => 1000],
                'points' => 100,
                'sort_order' => 30,
            ],
            [
                'key' => 'path-starter',
                'title' => 'Pathfinder',
                'description' => 'Complete your first learning path.',
                'icon' => 'map',
                'criteria' => ['type' => 'paths_completed', 'target' => 1],
                'points' => 100,
                'sort_order' => 40,
            ],
            [
                'key' => 'first-blood',
                'title' => 'First Blood',
                'description' => 'Be the first solver of any challenge.',
                'icon' => 'droplet',
                'criteria' => ['type' => 'first_blood', 'target' => 1],
                'points' => 25,
                'sort_order' => 50,
            ],
            [
                'key' => 'crypto-master',
                'title' => 'Crypto Master',
                'description' => 'Solve 3 cryptography challenges.',
                'icon' => 'lock',
                'criteria' => ['type' => 'category_solves', 'target' => 3, 'category_id' => $cryptoId],
                'points' => 120,
                'sort_order' => 60,
            ],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['key' => $achievement['key']],
                [
                    'title' => $achievement['title'],
                    'description' => $achievement['description'],
                    'icon' => $achievement['icon'],
                    'criteria' => $achievement['criteria'],
                    'points' => $achievement['points'],
                    'is_active' => true,
                    'sort_order' => $achievement['sort_order'],
                ],
            );
        }
    }
}
