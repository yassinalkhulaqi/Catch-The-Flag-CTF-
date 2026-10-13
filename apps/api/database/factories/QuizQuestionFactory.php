<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizQuestion>
 */
class QuizQuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'question' => fake()->sentence().'?',
            'type' => 'single',
            'points' => 1,
            'position' => 0,
            'is_published' => true,
        ];
    }

    /**
     * Create a question with options where exactly $correctIndex is right.
     *
     * @param  list<string>  $options
     */
    public function withOptions(Quiz $quiz, array $options = ['Alpha', 'Beta'], int $correctIndex = 0, string $type = 'single'): QuizQuestion
    {
        $question = QuizQuestion::forceCreate([
            'quiz_id' => $quiz->id,
            'question' => fake()->sentence().'?',
            'type' => $type,
            'points' => 1,
            'position' => 0,
            'is_published' => true,
        ]);

        foreach ($options as $i => $text) {
            QuizOption::forceCreate([
                'question_id' => $question->id,
                'option_text' => $text,
                'is_correct' => $i === $correctIndex,
                'position' => $i,
            ]);
        }

        return $question->refresh();
    }
}
