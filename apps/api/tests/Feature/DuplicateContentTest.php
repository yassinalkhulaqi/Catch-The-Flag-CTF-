<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\ChallengeHint;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\Tag;
use App\Models\User;
use Database\Factories\ChallengeFlagFactory;
use Database\Factories\QuizQuestionFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Content duplication (docs/content-authoring.md).
 *
 * A copy is a starting point for a variant, never a way to leak a flag or
 * double-count somebody's solve.
 */
class DuplicateContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_challenge_copies_content_hints_and_tags_but_not_secrets_or_stats(): void
    {
        $author = User::factory()->create();
        $admin = User::factory()->admin()->create();

        $tag = Tag::factory()->create();
        $challenge = Challenge::factory()->create([
            'author_id' => $author->id,
            'solve_count' => 42,
            'points' => 250,
        ]);
        $challenge->tags()->attach($tag->id);

        ChallengeHint::create([
            'challenge_id' => $challenge->id,
            'content' => 'Try reading the header bytes.',
            'cost_points' => 10,
            'position' => 1,
        ]);

        $flag = ChallengeFlagFactory::withPlaintext($challenge);

        $file = ChallengeFile::factory()->create([
            'challenge_id' => $challenge->id,
            'original_name' => 'evidence.pcap',
        ]);

        $response = $this->postJson(
            "/api/v1/admin/challenges/{$challenge->id}/duplicate",
            [],
            $this->headersFor($admin),
        );

        $response->assertCreated();
        $copyId = $response->json('data.id');

        $this->assertNotSame($challenge->id, $copyId);

        $copy = Challenge::find($copyId);

        $this->assertSame('draft', $copy->status->value);
        $this->assertSame($challenge->title.' (Copy)', $copy->title);
        $this->assertSame(0, $copy->solve_count);
        $this->assertSame($admin->id, $copy->author_id);
        $this->assertNull($copy->published_at);

        $this->assertCount(1, $copy->hints);
        $this->assertSame('Try reading the header bytes.', $copy->hints->first()->content);
        $this->assertSame(1, $copy->tags->count());

        // Secrets and payloads never travel.
        $this->assertCount(0, $copy->flags);
        $this->assertCount(0, $copy->files);
        $this->assertStringNotContainsString((string) $flag['plaintext'], (string) $copy->solution_walkthrough);

        $this->assertDatabaseHas('audit_logs', ['action' => 'challenge.duplicated', 'auditable_id' => $copy->id]);
    }

    public function test_duplicate_path_deep_copies_modules_lessons_linked_challenges_and_quizzes(): void
    {
        $admin = User::factory()->admin()->create();

        $path = Path::factory()->create();
        $module = PathModule::factory()->create(['path_id' => $path->id, 'title' => 'Recon']);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);
        $challenge = Challenge::factory()->create();
        $lesson->challenges()->attach($challenge->id);

        $moduleQuiz = Quiz::factory()->create(['module_id' => $module->id, 'lesson_id' => null]);
        QuizQuestionFactory::withOptions($moduleQuiz, ['Yes', 'No'], 0, 'single');

        $lessonQuiz = Quiz::factory()->forLesson($lesson->id)->create();
        QuizQuestionFactory::withOptions($lessonQuiz, ['A', 'B', 'C'], 1, 'multiple');

        $response = $this->postJson(
            "/api/v1/admin/paths/{$path->id}/duplicate",
            [],
            $this->headersFor($admin),
        );

        $response->assertCreated();
        $copy = Path::find($response->json('data.id'));

        $this->assertNotSame($path->id, $copy->id);
        $this->assertSame('draft', $copy->status->value);
        $this->assertSame($path->title.' (Copy)', $copy->title);
        $this->assertNull($copy->published_at);

        $this->assertCount(1, $copy->modules);
        $newModule = $copy->modules->first();
        $this->assertSame('Recon', $newModule->title);

        $this->assertCount(1, $newModule->lessons);
        $newLesson = $newModule->lessons->first();
        $this->assertSame($lesson->title, $newLesson->title);

        // Linked challenges follow the lesson, pointing at the same challenge.
        $this->assertEqualsCanonicalizing([$challenge->id], $newLesson->challenges()->pluck('challenges.id')->all());

        // Quizzes are deep copies: module quiz + lesson quiz, questions and options included.
        $moduleQuizzes = Quiz::where('module_id', $newModule->id)->get();
        $lessonQuizzes = Quiz::where('lesson_id', $newLesson->id)->get();

        $this->assertCount(1, $moduleQuizzes);
        $this->assertCount(1, $lessonQuizzes);
        $this->assertNotSame($moduleQuiz->id, $moduleQuizzes->first()->id);

        $moduleQuestions = QuizQuestion::where('quiz_id', $moduleQuizzes->first()->id)->get();

        $this->assertCount(1, $moduleQuestions);
        $this->assertSame(2, QuizOption::where('question_id', $moduleQuestions->first()->id)->count());
        $this->assertSame(
            1,
            QuizOption::where('question_id', $moduleQuestions->first()->id)->where('is_correct', true)->count(),
        );

        $this->assertDatabaseHas('audit_logs', ['action' => 'path.duplicated', 'auditable_id' => $copy->id]);
    }

    public function test_duplicate_requires_staff(): void
    {
        $challenge = Challenge::factory()->create();
        $path = Path::factory()->create();

        $this->postJson("/api/v1/admin/challenges/{$challenge->id}/duplicate")->assertUnauthorized();
        $this->postJson("/api/v1/admin/challenges/{$challenge->id}/duplicate", [], $this->headersFor(User::factory()->create()))
            ->assertForbidden();

        $this->postJson("/api/v1/admin/paths/{$path->id}/duplicate")->assertUnauthorized();
        $this->postJson("/api/v1/admin/paths/{$path->id}/duplicate", [], $this->headersFor(User::factory()->create()))
            ->assertForbidden();
    }

    /**
     * @return array<string, string>
     */
    private function headersFor(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }
}
