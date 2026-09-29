<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\ChallengeHint;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class IdorAndCrossResourceTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_cannot_download_file_from_another_challenge_id(): void
    {
        Storage::fake('challenge-files');
        $a = $this->makePublishedChallenge();
        $b = $this->makePublishedChallenge();
        $file = $this->attachTextFile($a, 'secret-a');

        $user = User::factory()->create();
        $this->actingAsApi($user)
            ->get("/api/v1/challenges/{$b->id}/files/{$file->id}")
            ->assertNotFound();
    }

    public function test_cannot_unlock_hint_from_another_challenge(): void
    {
        $a = $this->makePublishedChallenge();
        $b = $this->makePublishedChallenge();
        $hint = ChallengeHint::query()->create([
            'challenge_id' => $a->id,
            'content' => 'look at strings',
            'cost_points' => 0,
            'position' => 1,
        ]);

        $user = User::factory()->create();
        $this->actingAsApi($user)
            ->postJson("/api/v1/challenges/{$b->id}/hints/{$hint->id}/unlock")
            ->assertNotFound();
    }

    public function test_quiz_attempt_idor(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $challenge = $this->makePublishedChallenge();
        $path = Path::factory()->published()->create(['category_id' => $challenge->category_id]);
        $module = PathModule::factory()->create(['path_id' => $path->id]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);
        $quiz = Quiz::query()->create([
            'title' => 'Lesson Quiz',
            'pass_score' => 70,
            'is_published' => true,
            'module_id' => null,
            'lesson_id' => $lesson->id,
        ]);

        $attempt = QuizAttempt::query()->create([
            'user_id' => $owner->id,
            'quiz_id' => $quiz->id,
            'score' => 0,
            'passed' => false,
            'started_at' => now(),
        ]);

        $this->actingAsApi($intruder)
            ->getJson("/api/v1/quiz-attempts/{$attempt->id}")
            ->assertForbidden();

        $this->actingAsApi($intruder)
            ->postJson("/api/v1/quiz-attempts/{$attempt->id}/submit")
            ->assertForbidden();
    }
}
