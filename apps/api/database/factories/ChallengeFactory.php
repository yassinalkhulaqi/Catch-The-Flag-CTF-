<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use App\Models\Challenge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Challenge>
 */
class ChallengeFactory extends Factory
{
    public function definition(): array
    {
        $title = ucfirst(fake()->words(3, true));

        return [
            'title' => $title,
            'slug' => strtolower((string) preg_replace('/[^a-z0-9]+/', '-', $title)).'-'.fake()->unique()->randomNumber(5),
            'description' => fake()->paragraph(),
            'category_id' => Category::factory(),
            'difficulty' => 'beginner',
            'points' => 100,
            'estimated_minutes' => 30,
            'status' => 'published',
            'flag_validation_type' => 'static',
            'published_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
