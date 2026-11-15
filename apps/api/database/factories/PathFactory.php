<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Path;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Path>
 */
class PathFactory extends Factory
{
    public function definition(): array
    {
        $title = ucfirst(fake()->words(3, true));

        return [
            'title' => $title,
            'slug' => strtolower((string) preg_replace('/[^a-z0-9]+/', '-', $title)).'-'.fake()->unique()->randomNumber(5),
            'summary' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'difficulty' => 'beginner',
            'estimated_minutes' => 60,
            'status' => 'published',
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

    public function review(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'review',
            'published_at' => null,
        ]);
    }
}
