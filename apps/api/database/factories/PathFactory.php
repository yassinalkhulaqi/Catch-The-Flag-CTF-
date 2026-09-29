<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use App\Models\Category;
use App\Models\Path;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Path> */
class PathFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'title' => rtrim($title, '.'),
            'slug' => Str::slug($title).'-'.Str::random(5),
            'summary' => fake()->sentence(12),
            'description' => fake()->paragraph(),
            'category_id' => Category::factory(),
            'difficulty' => Difficulty::Beginner->value,
            'estimated_minutes' => 60,
            'status' => ContentStatus::Draft->value,
            'published_at' => null,
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
