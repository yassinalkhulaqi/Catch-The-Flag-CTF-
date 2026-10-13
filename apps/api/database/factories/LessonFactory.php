<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\PathModule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lesson>
 */
class LessonFactory extends Factory
{
    public function definition(): array
    {
        $title = ucfirst(fake()->words(3, true));

        return [
            'module_id' => PathModule::factory(),
            'title' => $title,
            'slug' => strtolower((string) preg_replace('/[^a-z0-9]+/', '-', $title)).'-'.fake()->unique()->randomNumber(5),
            'summary' => fake()->sentence(),
            'content' => "# Lesson\n\nLearn things.\n",
            'position' => 0,
            'estimated_minutes' => 15,
            'is_published' => true,
        ];
    }
}
