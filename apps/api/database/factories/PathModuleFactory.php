<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Path;
use App\Models\PathModule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PathModule>
 */
class PathModuleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'path_id' => Path::factory(),
            'title' => ucfirst(fake()->words(2, true)),
            'description' => fake()->sentence(),
            'position' => 0,
            'is_published' => true,
        ];
    }
}
