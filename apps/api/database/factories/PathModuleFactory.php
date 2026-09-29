<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Path;
use App\Models\PathModule;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PathModule> */
class PathModuleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'path_id' => Path::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'position' => 1,
            'is_published' => true,
        ];
    }
}
