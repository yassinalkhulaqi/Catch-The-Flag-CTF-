<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\XpReason;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\ProgressService;
use App\Services\XpService;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class GradeQuizAttemptAction
{
    public function __construct(
        private XpService $xp,
        private ProgressService $progress,
        private AchievementService $achievements,
    ) {}

    /**
     * @return array{attempt:QuizAttempt,score:int,passed:bool,correct_count:int,total:int}
     */
    public function handle(User $user, QuizAttempt $attempt): array
    {
        if ($attempt->user_id !== $user->id) {
            throw new HttpException(403, 'Forbidden.');
        }

        return DB::transaction(function () use ($user, $attempt): array {
            $locked = QuizAttempt::query()->whereKey($attempt->id)->lockForUpdate()->firstOrFail();

            if ($locked->user_id !== $user->id) {
                throw new HttpException(403, 'Forbidden.');
            }

            if ($locked->isCompleted()) {
                return [
                    'attempt' => $locked,
                    'score' => (int) $locked->score,
                    'passed' => (bool) $locked->passed,
                    'correct_count' => $locked->answers()->where('is_correct', true)->count(),
                    'total' => $locked->quiz->questions()->published()->count(),
                ];
            }

            $attempt = $locked;
            $quiz = $attempt->quiz()->with(['questions' => fn ($q) => $q->published()->with('options')])->firstOrFail();
            $answers = $attempt->answers()->get()->keyBy('question_id');

            $correctCount = 0;
            $earnedPoints = 0;
            $totalPoints = 0;

            foreach ($quiz->questions as $question) {
                /** @var QuizQuestion $question */
                $totalPoints += (int) $question->points;
                $answer = $answers->get($question->id);
                $selected = $answer?->selected_option_ids ?? [];
                $correctIds = $question->options->where('is_correct', true)->pluck('id')->sort()->values()->all();
                $selectedSorted = collect($selected)->map(fn ($id) => (int) $id)->sort()->values()->all();
                $isCorrect = $correctIds === $selectedSorted;

                if ($answer !== null) {
                    $answer->forceFill(['is_correct' => $isCorrect])->save();
                } else {
                    QuizAttemptAnswer::query()->create([
                        'attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                        'selected_option_ids' => [],
                        'is_correct' => false,
                    ]);
                }

                if ($isCorrect) {
                    $correctCount++;
                    $earnedPoints += (int) $question->points;
                }
            }

            $score = $totalPoints === 0 ? 0 : (int) round(($earnedPoints / $totalPoints) * 100);
            $passed = $score >= (int) $quiz->pass_score;

            $attempt->forceFill([
                'score' => $score,
                'passed' => $passed,
                'completed_at' => now(),
            ])->save();

            if ($passed) {
                $this->xp->award(
                    $user,
                    (int) config('ctf.xp.quiz_pass', 25),
                    XpReason::QuizPass,
                    $attempt,
                );

                $quiz->loadMissing(['lesson.module.path', 'module.path']);
                $path = $quiz->lesson?->module?->path ?? $quiz->module?->path;
                if ($path !== null) {
                    $this->progress->startPath($user, $path);
                    $this->progress->recalculatePath($user, $path);
                }

                $this->achievements->evaluate($user->fresh());
            }

            return [
                'attempt' => $attempt->refresh(),
                'score' => $score,
                'passed' => $passed,
                'correct_count' => $correctCount,
                'total' => $quiz->questions->count(),
            ];
        });
    }
}
