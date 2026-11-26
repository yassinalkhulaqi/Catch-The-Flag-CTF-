<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\User;
use Database\Factories\QuizQuestionFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Forms rely on one validation contract: 422 always means
 * `error.code = validation_failed` with a per-field map (docs/api.md §1.1).
 * These tests lock that contract in for payloads that previously fell
 * through to inline or missing validation.
 */
class FormValidationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function headersFor(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function assertFieldError(TestResponse $response, string $field): void
    {
        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['fields' => [$field]]]);
    }

    public function test_empty_flag_is_rejected_with_a_field_error(): void
    {
        $headers = $this->headersFor(User::factory()->create());
        $challenge = Challenge::factory()->create();

        $this->postJson("/api/v1/challenges/{$challenge->id}/submissions", ['flag' => ''], $headers)
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['fields' => ['flag']]]);
    }

    public function test_profile_and_password_payloads_are_field_validated(): void
    {
        $headers = $this->headersFor(User::factory()->create());

        $this->putJson('/api/v1/profile', ['bio' => str_repeat('x', 501)], $headers)
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['fields' => ['bio']]]);

        $this->putJson('/api/v1/profile/password', [
            'current_password' => 'not-the-current-password',
            'password' => 'short',
            'password_confirmation' => 'different',
        ], $headers)
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['fields' => ['password']]]);
    }

    public function test_bookmark_payload_is_field_validated(): void
    {
        $headers = $this->headersFor(User::factory()->create());

        $response = $this->postJson('/api/v1/me/bookmarks', [
            'type' => 'not-a-target',
            'id' => 0,
            'note' => str_repeat('n', 2001),
        ], $headers);

        $this->assertFieldError($response, 'type');
        $this->assertFieldError($response, 'id');
        $this->assertFieldError($response, 'note');
    }

    public function test_quiz_answer_requires_a_selection(): void
    {
        $user = User::factory()->create();
        $headers = $this->headersFor($user);
        $quiz = Quiz::factory()->create(['pass_score' => 50]);
        $question = (new QuizQuestionFactory)->withOptions($quiz, ['Paris', 'London'], 0);
        $attemptId = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [], $headers)
            ->assertCreated()->json('data.attempt.id');

        $this->postJson("/api/v1/quiz-attempts/{$attemptId}/answer", [
            'question_id' => $question->id,
        ], $headers)->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['fields' => ['selected_option_ids']]]);
    }

    public function test_admin_create_forms_reject_missing_required_fields(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $challenge = Challenge::factory()->create();
        $module = PathModule::factory()->create();

        $this->assertFieldError($this->postJson('/api/v1/admin/challenges', [], $headers), 'title');
        $this->assertFieldError($this->postJson('/api/v1/admin/paths', [], $headers), 'title');
        $this->assertFieldError($this->postJson("/api/v1/admin/modules/{$module->id}/lessons", [], $headers), 'title');
        $this->assertFieldError($this->postJson("/api/v1/admin/challenges/{$challenge->id}/hints", [], $headers), 'content');
        $this->assertFieldError($this->postJson("/api/v1/admin/modules/{$module->id}/quizzes", [], $headers), 'title');
        $this->assertFieldError($this->postJson('/api/v1/admin/tags', [], $headers), 'name');
        $this->assertFieldError($this->postJson('/api/v1/admin/categories', [], $headers), 'name');
    }

    public function test_index_filters_validate_values(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());
        $userHeaders = $this->headersFor(User::factory()->create());

        $this->assertFieldError($this->getJson('/api/v1/admin/paths?status=bogus', $headers), 'status');
        $this->assertFieldError($this->getJson('/api/v1/admin/paths?per_page=101', $headers), 'per_page');
        $this->assertFieldError($this->getJson('/api/v1/leaderboard?per_page=101', $userHeaders), 'per_page');
        $this->assertFieldError($this->getJson('/api/v1/admin/analytics/xp?days=3', $headers), 'days');
    }

    public function test_duplicate_category_name_is_rejected(): void
    {
        $headers = $this->headersFor(User::factory()->admin()->create());

        $this->postJson('/api/v1/admin/categories', ['name' => 'Unique Name'], $headers)->assertCreated();
        $this->assertFieldError(
            $this->postJson('/api/v1/admin/categories', ['name' => 'Unique Name'], $headers),
            'name'
        );
    }
}
