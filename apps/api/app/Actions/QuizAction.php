<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\QuizQuestionType;
use App\Enums\XpReason;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\AchievementEvaluator;
use App\Services\ProgressCalculator;
use App\Services\XpAwarder;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Server-side quiz lifecycle. The client sends selections; scoring,
 * passing, and XP happen here. Correctness of options never leaves
 * the server until an attempt is submitted.
 */
class QuizAction
{
    public function __construct(
        private readonly XpAwarder $xp,
        private readonly ProgressCalculator $progress,
        private readonly AchievementEvaluator $achievements,
    ) {}

    public function startAttempt(User $user, Quiz $quiz): QuizAttempt
    {
        return DB::transaction(function () use ($user, $quiz): QuizAttempt {
            return QuizAttempt::forceCreate([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'started_at' => now(),
            ]);
        });
    }

    /**
     * Record one answer. Re-answering overwrites (UNIQUE attempt+question).
     *
     * @param  list<int>  $selectedOptionIds
     * @return array{saved: bool}
     */
    public function answer(User $user, QuizAttempt $attempt, int $questionId, array $selectedOptionIds): array
    {
        $question = $attempt->quiz->questions()->where('id', $questionId)->firstOrFail();

        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->isSubmitted()) {
            throw new HttpException(409, 'This attempt has already been submitted.');
        }

        $selected = array_values(array_unique(array_map(intval(...), $selectedOptionIds)));

        $this->assertSelectionShape($question, $selected);

        return DB::transaction(function () use ($attempt, $question, $selected): array {
            $answer = QuizAttemptAnswer::query()
                ->where('attempt_id', $attempt->id)
                ->where('question_id', $question->id)
                ->first();

            if ($answer === null) {
                QuizAttemptAnswer::forceCreate([
                    'attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'selected_option_ids' => $selected,
                    'is_correct' => $this->grade($question, $selected),
                ]);
            } else {
                $answer->forceFill([
                    'selected_option_ids' => $selected,
                    'is_correct' => $this->grade($question, $selected),
                ])->save();
            }

            return ['saved' => true];
        });
    }

    /**
     * Score the attempt (percent of question points), mark pass/fail,
     * award XP on first pass.
     *
     * @return array{score: int, passed: bool, correct_count: int, total: int}
     */
    public function submit(User $user, QuizAttempt $attempt): array
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->isSubmitted()) {
            throw new HttpException(409, 'This attempt has already been submitted.');
        }

        return DB::transaction(function () use ($user, $attempt): array {
            $questions = $attempt->quiz->questions()->with('options')->get();

            $totalPoints = max(1, $questions->sum('points'));
            $earned = 0;
            $correctCount = 0;

            foreach ($questions as $question) {
                $answer = $attempt->answers()->where('question_id', $question->id)->first();

                $selected = $answer !== null ? (array) $answer->selected_option_ids : [];
                $correct = $this->grade($question, array_map(intval(...), $selected));

                if ($answer === null) {
                    QuizAttemptAnswer::forceCreate([
                        'attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                        'selected_option_ids' => $selected,
                        'is_correct' => $correct,
                    ]);
                } elseif ($answer->is_correct !== $correct) {
                    $answer->forceFill(['is_correct' => $correct])->save();
                }

                if ($correct) {
                    $earned += $question->points;
                    $correctCount++;
                }
            }

            $score = (int) min(100, round($earned / $totalPoints * 100));
            $passed = $score >= $attempt->quiz->pass_score;

            $hadPassedBefore = QuizAttempt::query()
                ->where('user_id', $user->id)
                ->where('quiz_id', $attempt->quiz_id)
                ->where('passed', true)
                ->exists();

            $attempt->forceFill([
                'score' => $score,
                'passed' => $passed,
                'completed_at' => now(),
            ])->save();

            if ($passed && ! $hadPassedBefore) {
                $this->xp->award(
                    $user,
                    (int) config('ctf.xp.quiz_pass'),
                    XpReason::QuizPass,
                    Quiz::class,
                    $attempt->quiz_id,
                );
            }

            $fresh = $user->refresh();
            $this->progress->recomputeForUser($fresh);
            $this->achievements->evaluate($fresh);

            return [
                'score' => $score,
                'passed' => $passed,
                'correct_count' => $correctCount,
                'total' => $questions->count(),
            ];
        });
    }

    /**
     * @param  list<int>  $selected
     */
    private function assertSelectionShape(QuizQuestion $question, array $selected): void
    {
        $valid = $question->options->pluck('id')->map(static fn ($id): int => (int) $id)->all();
        $unknown = array_diff($selected, $valid);

        if ($unknown !== []) {
            abort(422, 'Unknown option selected.');
        }

        if ($question->type === QuizQuestionType::Single && count($selected) !== 1) {
            abort(422, 'Select exactly one option.');
        }

        if ($question->type === QuizQuestionType::TrueFalse && count($selected) !== 1) {
            abort(422, 'Select exactly one option.');
        }

        if ($selected === []) {
            abort(422, 'Select at least one option.');
        }
    }

    /**
     * @param  list<int>  $selected
     */
    private function grade(QuizQuestion $question, array $selected): bool
    {
        $correct = $question->options->where('is_correct', true)->pluck('id')
            ->map(static fn ($id): int => (int) $id)->sort()->values()->all();

        sort($selected);

        return $selected === $correct;
    }
}
