<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PathModule;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quiz>
 */
class QuizFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => ucfirst(fake()->words(2, true)).' quiz',
            'description' => fake()->sentence(),
            'pass_score' => 70,
            'position' => 0,
            'is_published' => true,
            // A quiz always hangs off exactly one parent (XOR CHECK):
            // default to a fresh module unless forLesson() overrides.
            'module_id' => PathModule::factory(),
            'lesson_id' => null,
        ];
    }

    /**
     * Attach the quiz to a lesson (satisfies the module XOR lesson CHECK).
     */
    public function forLesson(int $lessonId): static
    {
        return $this->state(fn (array $attributes) => [
            'lesson_id' => $lessonId,
            'module_id' => null,
        ]);
    }

    /**
     * Attach the quiz to a module.
     */
    public function forModule(int $moduleId): static
    {
        return $this->state(fn (array $attributes) => [
            'module_id' => $moduleId,
            'lesson_id' => null,
        ]);
    }
}
