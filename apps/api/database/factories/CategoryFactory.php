<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = ucfirst(fake()->unique()->word());

        return [
            'name' => $name,
            'slug' => strtolower((string) preg_replace('/[^a-z0-9]+/', '-', $name)).'-'.fake()->unique()->randomNumber(5),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
