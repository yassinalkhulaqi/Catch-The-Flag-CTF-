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
use Illuminate\Support\Facades\DB;

final class ProgressService
{
    public function __construct(private XpService $xp) {}

    public function startPath(User $user, Path $path): UserPathProgress
    {
        return UserPathProgress::query()->firstOrCreate(
            ['user_id' => $user->id, 'path_id' => $path->id],
            ['status' => PathProgressStatus::InProgress->value, 'started_at' => now()],
        );
    }

    public function completeLesson(User $user, Lesson $lesson): LessonCompletion
    {
        return DB::transaction(function () use ($user, $lesson): LessonCompletion {
            $completion = LessonCompletion::query()->firstOrCreate(
                ['user_id' => $user->id, 'lesson_id' => $lesson->id],
                ['completed_at' => now()],
            );

            if ($completion->wasRecentlyCreated) {
                $this->xp->award(
                    $user,
                    (int) config('ctf.xp.lesson_complete', 10),
                    XpReason::LessonComplete,
                    $lesson,
                );
            }

            $lesson->loadMissing('module.path');
            if ($lesson->module?->path) {
                $this->startPath($user, $lesson->module->path);
                $this->recalculatePath($user, $lesson->module->path);
            }

            return $completion;
        });
    }

    public function recalculatePath(User $user, Path $path): UserPathProgress
    {
        $progress = $this->startPath($user, $path);
        $completed = $this->isPathComplete($user, $path);

        if ($completed && $progress->status !== PathProgressStatus::Completed) {
            $progress->forceFill([
                'status' => PathProgressStatus::Completed->value,
                'completed_at' => now(),
            ])->save();

            $this->xp->award(
                $user,
                (int) config('ctf.xp.path_complete', 200),
                XpReason::PathComplete,
                $path,
            );
        }

        return $progress->refresh();
    }

    public function progressPercent(User $user, Path $path): int
    {
        $modules = $path->modules()->published()->with(['lessons' => fn ($q) => $q->published()])->get();
        $lessonIds = $modules->flatMap(fn (PathModule $m) => $m->lessons->pluck('id'))->all();

        if ($lessonIds === []) {
            return 0;
        }

        $done = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->count();

        return (int) floor(($done / count($lessonIds)) * 100);
    }

    public function isModuleComplete(User $user, PathModule $module): bool
    {
        $lessons = $module->lessons()->published()->with('challenges')->get();
        if ($lessons->isEmpty()) {
            return false;
        }

        $lessonIds = $lessons->pluck('id');
        $completedCount = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->count();

        if ($completedCount < $lessonIds->count()) {
            return false;
        }

        $challengeIds = $lessons->flatMap(fn (Lesson $l) => $l->challenges->pluck('id'))->unique();
        if ($challengeIds->isNotEmpty()) {
            $solved = ChallengeSolve::query()
                ->where('user_id', $user->id)
                ->whereIn('challenge_id', $challengeIds)
                ->count();
            if ($solved < $challengeIds->count()) {
                return false;
            }
        }

        $moduleQuizIds = $module->quizzes()->published()->pluck('id');
        foreach ($moduleQuizIds as $quizId) {
            $passed = QuizAttempt::query()
                ->where('user_id', $user->id)
                ->where('quiz_id', $quizId)
                ->where('passed', true)
                ->exists();
            if (! $passed) {
                return false;
            }
        }

        return true;
    }

    public function isPathComplete(User $user, Path $path): bool
    {
        $modules = $path->modules()->published()->get();
        if ($modules->isEmpty()) {
            return false;
        }

        foreach ($modules as $module) {
            if (! $this->isModuleComplete($user, $module)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array{completed_lessons:int,total_lessons:int,completed_challenges:int,total_challenges:int,percent:int,status:string}
     */
    public function breakdown(User $user, Path $path): array
    {
        $modules = $path->modules()->published()->with(['lessons' => fn ($q) => $q->published()->with('challenges')])->get();
        $lessons = $modules->flatMap(fn (PathModule $m) => $m->lessons);
        $lessonIds = $lessons->pluck('id');
        $challengeIds = $lessons->flatMap(fn (Lesson $l) => $l->challenges->pluck('id'))->unique();

        $completedLessons = $lessonIds->isEmpty() ? 0 : LessonCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->count();

        $completedChallenges = $challengeIds->isEmpty() ? 0 : ChallengeSolve::query()
            ->where('user_id', $user->id)
            ->whereIn('challenge_id', $challengeIds)
            ->count();

        $totalLessons = $lessonIds->count();
        $percent = $totalLessons === 0 ? 0 : (int) floor(($completedLessons / $totalLessons) * 100);

        $progress = UserPathProgress::query()
            ->where('user_id', $user->id)
            ->where('path_id', $path->id)
            ->first();

        return [
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'completed_challenges' => $completedChallenges,
            'total_challenges' => $challengeIds->count(),
            'percent' => $percent,
            'status' => $progress?->status?->value ?? PathProgressStatus::InProgress->value,
        ];
    }
}
