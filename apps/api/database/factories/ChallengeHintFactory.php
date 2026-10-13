<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Challenge;
use App\Models\ChallengeHint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChallengeHint>
 */
class ChallengeHintFactory extends Factory
{
    public function definition(): array
    {
        return [
            'challenge_id' => Challenge::factory(),
            'content' => fake()->sentence(),
            'cost_points' => 10,
            'position' => 1,
        ];
    }
}
