<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\QuizQuestionType;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class AdminQuizAnswersTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_admin_quiz_show_includes_is_correct_for_editors(): void
    {
        $admin = User::factory()->admin()->create();
        $path = Path::factory()->published()->create();
        $module = PathModule::factory()->create(['path_id' => $path->id]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);
        $quiz = Quiz::query()->create([
            'title' => 'Staff quiz',
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
        ]);
        $question->options()->create(['option_text' => '4', 'is_correct' => true, 'position' => 0]);
        $question->options()->create(['option_text' => '5', 'is_correct' => false, 'position' => 1]);

        $response = $this->actingAsApi($admin)->getJson("/api/v1/admin/quizzes/{$quiz->id}");
        $response->assertOk();
        $options = $response->json('data.questions.0.options');
        $this->assertIsArray($options);
        $this->assertArrayHasKey('is_correct', $options[0]);
        $this->assertTrue(collect($options)->contains(fn ($o) => ($o['is_correct'] ?? false) === true));
    }

    public function test_learner_quiz_show_still_hides_is_correct(): void
    {
        $user = User::factory()->create();
        $path = Path::factory()->published()->create();
        $module = PathModule::factory()->create(['path_id' => $path->id]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);
        $quiz = Quiz::query()->create([
            'title' => 'Learner quiz',
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
        ]);
        $question->options()->create(['option_text' => '4', 'is_correct' => true, 'position' => 0]);

        $payload = json_encode(
            $this->actingAsApi($user)->getJson("/api/v1/quizzes/{$quiz->id}")->assertOk()->json()
        );
        $this->assertStringNotContainsString('is_correct', (string) $payload);
    }
}
