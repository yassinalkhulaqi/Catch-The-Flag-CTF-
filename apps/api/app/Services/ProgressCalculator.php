<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PathProgressStatus;
use App\Enums\XpReason;
use App\Models\ChallengeSolve;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\UserPathProgress;
use App\Models\XpTransaction;
use App\Notifications\PathCompletedNotification;
use Illuminate\Support\Facades\DB;

/**
 * Deterministic progress recomputation (docs/database.md §8).
 * Called after every solve / lesson-complete / quiz-pass event.
 * Rows are only ever written here — never from client input.
 */
class ProgressCalculator
{
    public function __construct(
        private readonly XpAwarder $xp,
        private readonly AchievementEvaluator $achievements,
    ) {}

    /**
     * Recompute every path the user started that contains the lesson's
     * path, or all started paths when no context is given.
     */
    public function recomputeForUser(User $user, ?Path $only = null): void
    {
        $paths = $only !== null
            ? collect([$only])
            : $user->pathProgress()->with('path')->get()->pluck('path')->filter();

        foreach ($paths as $path) {
            $this->recomputePath($user, $path);
        }
    }

    public function recomputePath(User $user, Path $path): void
    {
        DB::transaction(function () use ($user, $path): void {
            $complete = $this->isPathComplete($user, $path);

            $progress = UserPathProgress::query()
                ->where('user_id', $user->id)
                ->where('path_id', $path->id)
                ->first();

            if ($progress === null) {
                return;
            }

            if ($complete && $progress->status !== PathProgressStatus::Completed) {
                $progress->forceFill([
                    'status' => PathProgressStatus::Completed,
                    'completed_at' => now(),
                ])->save();

                $this->xp->award(
                    $user->refresh(),
                    (int) config('ctf.xp.path_complete'),
                    XpReason::PathComplete,
                    Path::class,
                    $path->id,
                );

                $user->notify(new PathCompletedNotification($path->id, $path->title));

                $this->achievements->evaluate($user->refresh());
            }
        });
    }

    public function isPathComplete(User $user, Path $path): bool
    {
        $modules = $path->modules()->where('is_published', true)->get();

        if ($modules->isEmpty()) {
            return false;
        }

        foreach ($modules as $module) {
            if (! $this->isModuleComplete($user, $module, $path)) {
                return false;
            }
        }

        return true;
    }

    public function isModuleComplete(User $user, PathModule $module, ?Path $path = null): bool
    {
        $path ??= $module->path;

        $lessons = $module->lessons()->where('is_published', true)->pluck('id');

        $completedLessons = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessons)
            ->pluck('lesson_id');

        if ($completedLessons->count() !== $lessons->count()) {
            return false;
        }

        // Quizzes attached to the module or its lessons must be passed.
        $quizIds = $this->moduleQuizIds($module);

        if ($quizIds !== []) {
            $passed = QuizAttempt::query()
                ->where('user_id', $user->id)
                ->whereIn('quiz_id', $quizIds)
                ->where('passed', true)
                ->distinct()
                ->count('quiz_id');

            if ($passed !== count($quizIds)) {
                return false;
            }
        }

        // Challenges linked to the module's lessons must be solved.
        $challengeIds = DB::table('lesson_challenge')
            ->whereIn('lesson_id', $lessons)
            ->distinct()
            ->pluck('challenge_id');

        if ($challengeIds->isNotEmpty()) {
            $solved = ChallengeSolve::query()
                ->where('user_id', $user->id)
                ->whereIn('challenge_id', $challengeIds)
                ->distinct()
                ->count('challenge_id');

            if ($solved !== $challengeIds->count()) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return list<int>
     */
    private function moduleQuizIds(PathModule $module): array
    {
        $moduleQuizzes = DB::table('quizzes')
            ->where('module_id', $module->id)
            ->where('is_published', true)
            ->pluck('id');

        $lessonIds = $module->lessons()->where('is_published', true)->pluck('id');

        $lessonQuizzes = $lessonIds->isNotEmpty()
            ? DB::table('quizzes')->whereIn('lesson_id', $lessonIds)->where('is_published', true)->pluck('id')
            : collect();

        return $moduleQuizzes->merge($lessonQuizzes)->map(static fn ($id): int => (int) $id)->unique()->all();
    }

    /**
     * Current activity streak in days, derived from the XP ledger
     * (consecutive UTC days with ≥1 transaction, ending today/yesterday).
     */
    public function streakDays(User $user): int
    {
        $days = XpTransaction::query()
            ->where('user_id', $user->id)
            ->selectRaw('DATE(created_at) as day')
            ->distinct()
            ->orderByDesc('day')
            ->pluck('day')
            ->map(static fn ($day): string => (string) $day)
            ->all();

        if ($days === []) {
            return 0;
        }

        $today = now()->utc()->toDateString();
        $yesterday = now()->utc()->subDay()->toDateString();

        if ($days[0] !== $today && $days[0] !== $yesterday) {
            return 0;
        }

        $streak = 0;
        $expected = $days[0] === $today ? now()->utc() : now()->utc()->subDay();

        foreach ($days as $day) {
            if ($day !== $expected->toDateString()) {
                break;
            }
            $streak++;
            $expected = $expected->copy()->subDay();
        }

        return $streak;
    }

    /**
     * Completion percentage over published lessons (0–100).
     */
    public function percentFor(User $user, Path $path): int
    {
        $lessonIds = Lesson::query()
            ->whereHas('module', fn ($query) => $query->where('path_id', $path->id)->where('is_published', true))
            ->where('is_published', true)
            ->pluck('id');

        if ($lessonIds->isEmpty()) {
            return 0;
        }

        $done = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->count();

        return (int) min(100, round($done / $lessonIds->count() * 100));
    }
}
