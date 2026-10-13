<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Achievement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Achievement>
 */
class AchievementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'key' => 'test-'.fake()->unique()->lexify('????????'),
            'title' => ucfirst(fake()->words(2, true)),
            'description' => fake()->sentence(),
            'criteria' => ['type' => 'solves_total', 'target' => 1],
            'points' => 50,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
