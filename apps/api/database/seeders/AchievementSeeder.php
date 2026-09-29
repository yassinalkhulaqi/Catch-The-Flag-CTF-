<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AchievementCriteriaType;
use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'key' => 'first_blood',
                'title' => 'First Blood',
                'description' => 'Solve your first challenge.',
                'icon' => 'trophy',
                'criteria' => ['type' => AchievementCriteriaType::SolvesTotal->value, 'threshold' => 1],
                'points' => 25,
                'sort_order' => 1,
            ],
            [
                'key' => 'solver_10',
                'title' => 'Rising Solver',
                'description' => 'Solve 10 challenges.',
                'icon' => 'star',
                'criteria' => ['type' => AchievementCriteriaType::SolvesTotal->value, 'threshold' => 10],
                'points' => 50,
                'sort_order' => 2,
            ],
            [
                'key' => 'xp_500',
                'title' => 'XP Hunter',
                'description' => 'Reach 500 XP.',
                'icon' => 'zap',
                'criteria' => ['type' => AchievementCriteriaType::XpTotal->value, 'threshold' => 500],
                'points' => 50,
                'sort_order' => 3,
            ],
            [
                'key' => 'path_complete_1',
                'title' => 'Pathfinder',
                'description' => 'Complete your first learning path.',
                'icon' => 'map',
                'criteria' => ['type' => AchievementCriteriaType::PathsCompleted->value, 'threshold' => 1],
                'points' => 75,
                'sort_order' => 4,
            ],
        ];

        foreach ($rows as $row) {
            Achievement::query()->updateOrCreate(['key' => $row['key']], $row + ['is_active' => true]);
        }
    }
}
