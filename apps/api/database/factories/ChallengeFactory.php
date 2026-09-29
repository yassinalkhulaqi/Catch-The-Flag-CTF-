<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use App\Enums\FlagValidationType;
use App\Models\Category;
use App\Models\Challenge;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Challenge> */
class ChallengeFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'title' => rtrim($title, '.'),
            'slug' => Str::slug($title).'-'.Str::random(5),
            'description' => fake()->paragraph(),
            'scenario' => fake()->sentence(),
            'category_id' => Category::factory(),
            'difficulty' => Difficulty::Beginner->value,
            'points' => 100,
            'estimated_minutes' => 30,
            'status' => ContentStatus::Draft->value,
            'flag_validation_type' => FlagValidationType::Static->value,
            'published_at' => null,
            'solve_count' => 0,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => ContentStatus::Published->value,
            'published_at' => now(),
        ]);
    }
}
