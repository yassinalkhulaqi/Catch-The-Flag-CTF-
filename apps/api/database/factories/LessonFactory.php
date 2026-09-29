<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\PathModule;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Lesson> */
class LessonFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'module_id' => PathModule::factory(),
            'title' => rtrim($title, '.'),
            'slug' => Str::slug($title).'-'.Str::random(4),
            'summary' => fake()->sentence(),
            'content' => '# '.fake()->sentence()."\n\n".fake()->paragraph(),
            'position' => 1,
            'estimated_minutes' => 10,
            'is_published' => true,
        ];
    }
}
