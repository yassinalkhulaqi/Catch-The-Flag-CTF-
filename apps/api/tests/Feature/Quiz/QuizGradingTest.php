<?php

declare(strict_types=1);

namespace Tests\Feature\Quiz;

use App\Enums\QuizQuestionType;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class QuizGradingTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_quiz_show_does_not_leak_correct_answers_before_submit(): void
    {
        $user = User::factory()->create();
        $path = Path::factory()->published()->create();
        $module = PathModule::factory()->create(['path_id' => $path->id]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);
        $quiz = Quiz::query()->create([
            'title' => 'Check',
            'pass_score' => 70,
            'is_published' => true,
            'lesson_id' => $lesson->id,
            'module_id' => null,
        ]);
        $question = $quiz->questions()->create([
            'question' => '2+2?',
            'type' => QuizQuestionType::Single->value,
            'points' => 1,
            'position' => 1,
            'is_published' => true,
            'explanation' => 'Basic arithmetic',
        ]);
        $correct = $question->options()->create(['option_text' => '4', 'is_correct' => true, 'position' => 0]);
        $question->options()->create(['option_text' => '5', 'is_correct' => false, 'position' => 1]);

        $show = $this->actingAsApi($user)->getJson("/api/v1/quizzes/{$quiz->id}");
        $show->assertOk();
        $payload = json_encode($show->json());
        $this->assertStringNotContainsString('is_correct', $payload);
        $this->assertStringNotContainsString('Basic arithmetic', $payload);

        $attempt = $this->actingAsApi($user)->postJson("/api/v1/quizzes/{$quiz->id}/attempts");
        $attempt->assertCreated();
        $attemptId = $attempt->json('data.id');

        $this->actingAsApi($user)->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
            'question_id' => $question->id,
            'selected_option_ids' => [$correct->id],
        ])->assertOk();

        $submit = $this->actingAsApi($user)->postJson("/api/v1/quiz-attempts/{$attemptId}/submit");
        $submit->assertOk()
            ->assertJsonPath('data.passed', true)
            ->assertJsonPath('data.correct_count', 1);

        $this->assertGreaterThan(0, (int) $user->fresh()->xp);
    }
}
