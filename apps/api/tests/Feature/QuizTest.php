<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use Database\Factories\QuizQuestionFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{User, array<string, string>, Quiz, QuizQuestion, QuizQuestion} */
    private function makeFixture(): array
    {
        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $quiz = Quiz::factory()->create(['pass_score' => 50]);

        $factory = new QuizQuestionFactory;
        $q1 = $factory->withOptions($quiz, ['Paris', 'London'], 0);
        $q2 = $factory->withOptions($quiz, ['True', 'False'], 1, 'true_false');

        return [$user, $headers, $quiz, $q1, $q2];
    }

    public function test_quiz_hides_correctness_before_submit(): void
    {
        [, $headers, $quiz] = $this->makeFixture();

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}", $headers)->assertOk();

        $body = $response->getContent() ?: '';
        $this->assertStringNotContainsString('is_correct', $body);

        foreach ($response->json('data.questions') as $question) {
            $this->assertArrayHasKey('options', $question);
            foreach ($question['options'] as $option) {
                $this->assertArrayNotHasKey('is_correct', $option);
            }
        }
    }

    public function test_full_attempt_flow_scores_and_awards_xp(): void
    {
        [$user, $headers, $quiz, $q1, $q2] = $this->makeFixture();

        $attemptId = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [], $headers)
            ->assertCreated()
            ->json('data.attempt.id');

        $o1 = $q1->options()->where('is_correct', true)->firstOrFail()->id;
        $o2 = $q2->options()->where('is_correct', false)->firstOrFail()->id;

        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
            'question_id' => $q1->id,
            'selected_option_ids' => [$o1],
        ], $headers)->assertOk()->assertJsonPath('data.saved', true);

        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
            'question_id' => $q2->id,
            'selected_option_ids' => [$o2],
        ], $headers)->assertOk();

        // 1 of 2 questions correct, pass_score 50 → score 50 → passed.
        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/submit", [], $headers)->assertOk()
            ->assertJsonPath('data.score', 50)
            ->assertJsonPath('data.passed', true)
            ->assertJsonPath('data.correct_count', 1)
            ->assertJsonPath('data.total', 2);

        $this->assertSame((int) config('ctf.xp.quiz_pass'), (int) $user->refresh()->xp);

        // Submitted attempt reveals correctness + explanations.
        $show = $this->getJson("/api/v1/quiz-attempts/{$attemptId}", $headers)->assertOk();
        $this->assertArrayHasKey('answered', $show->json('data.questions.0'));
    }

    public function test_second_pass_awards_no_xp(): void
    {
        [$user, $headers, $quiz, $q1, $q2] = $this->makeFixture();

        $answerAll = function () use ($headers, $quiz, $q1, $q2): void {
            $attemptId = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [], $headers)
                ->assertCreated()->json('data.attempt.id');

            $this->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
                'question_id' => $q1->id,
                'selected_option_ids' => [$q1->options()->where('is_correct', true)->firstOrFail()->id],
            ], $headers)->assertOk();

            $this->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
                'question_id' => $q2->id,
                'selected_option_ids' => [$q2->options()->where('is_correct', true)->firstOrFail()->id],
            ], $headers)->assertOk();

            $this->postJson("/api/v1/quiz-attempts/{$attemptId}/submit", [], $headers)->assertOk()
                ->assertJsonPath('data.passed', true);
        };

        $answerAll();
        $answerAll();

        $this->assertSame((int) config('ctf.xp.quiz_pass'), (int) $user->refresh()->xp);
    }

    public function test_resubmit_is_conflict_and_foreign_attempt_is_404(): void
    {
        [$user, $headers, $quiz, $q1] = $this->makeFixture();

        $attemptId = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [], $headers)
            ->assertCreated()->json('data.attempt.id');

        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/submit", [], $headers)->assertOk();
        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/submit", [], $headers)
            ->assertConflict();

        $other = User::factory()->create();
        $otherHeaders = ['Authorization' => 'Bearer '.$other->createToken('web', ['*'], now()->addDay())->plainTextToken];

        // Fresh guard: feature tests share one app instance, and the
        // cached first user would otherwise satisfy the policy.
        $this->app['auth']->forgetGuards();

        $this->getJson("/api/v1/quiz-attempts/{$attemptId}", $otherHeaders)->assertNotFound();
        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
            'question_id' => $q1->id,
            'selected_option_ids' => [1],
        ], $otherHeaders)->assertNotFound();
    }

    public function test_unknown_option_is_rejected(): void
    {
        [, $headers, $quiz, $q1] = $this->makeFixture();

        $attemptId = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [], $headers)
            ->assertCreated()->json('data.attempt.id');

        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
            'question_id' => $q1->id,
            'selected_option_ids' => [999999],
        ], $headers)->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['fields' => ['form']]]);
    }
}
