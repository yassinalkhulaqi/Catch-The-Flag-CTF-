<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ContentStatus;
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
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ProgressService
{
    public function __construct(private XpService $xp) {}

    public function startPath(User $user, Path $path): UserPathProgress
    {
        return DB::transaction(function () use ($user, $path): UserPathProgress {
            $existing = $this->lockProgress($user, $path);
            if ($existing !== null) {
                return $existing;
            }

            $missing = $this->unmetPrerequisites($user, $path);
            if ($missing->isNotEmpty() && ! $user->isModerator()) {
                throw ValidationException::withMessages([
                    'path' => $this->prerequisiteMessage($missing),
                ]);
            }

            try {
                $row = new UserPathProgress;
                $row->forceFill([
                    'user_id' => $user->id,
                    'path_id' => $path->id,
                    'status' => PathProgressStatus::InProgress->value,
                    'started_at' => now(),
                ])->save();

                return $row;
            } catch (UniqueConstraintViolationException) {
                return UserPathProgress::query()
                    ->where('user_id', $user->id)
                    ->where('path_id', $path->id)
                    ->firstOrFail();
            }
        });
    }

    /**
     * Learners cannot open a path's modules or lessons until its published
     * prerequisites are complete, unless they already started it.
     */
    public function ensureUnlocked(User $user, Path $path): void
    {
        if ($user->isModerator() || $this->hasStarted($user, $path)) {
            return;
        }

        $missing = $this->unmetPrerequisites($user, $path);
        if ($missing->isNotEmpty()) {
            abort(403, $this->prerequisiteMessage($missing));
        }
    }

    /**
     * Published prerequisites the user has not completed.
     *
     * @return Collection<int, Path>
     */
    public function unmetPrerequisites(User $user, Path $path): Collection
    {
        $required = $this->publishedPrerequisites($path);
        if ($required->isEmpty()) {
            return $required;
        }

        $done = UserPathProgress::query()
            ->where('user_id', $user->id)
            ->where('status', PathProgressStatus::Completed)
            ->whereIn('path_id', $required->pluck('id'))
            ->pluck('path_id');

        return $required->reject(fn (Path $pre) => $done->contains($pre->id))->values();
    }

    public function hasStarted(User $user, Path $path): bool
    {
        return UserPathProgress::query()
            ->where('user_id', $user->id)
            ->where('path_id', $path->id)
            ->exists();
    }

    /**
     * @return Collection<int, Path>
     */
    public function publishedPrerequisites(Path $path): Collection
    {
        $path->loadMissing('prerequisites');

        return $path->prerequisites
            ->filter(fn (Path $pre) => $pre->status === ContentStatus::Published)
            ->values();
    }

    /**
     * @param  Collection<int, Path>  $missing
     */
    public function prerequisiteMessage(Collection $missing): string
    {
        return 'Complete the required paths before starting this one: '.$missing->pluck('title')->join(', ').'.';
    }

    private function lockProgress(User $user, Path $path): ?UserPathProgress
    {
        return UserPathProgress::query()
            ->where('user_id', $user->id)
            ->where('path_id', $path->id)
            ->lockForUpdate()
            ->first();
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
        $modules = $path->relationLoaded('modules')
            ? $path->modules
            : $path->modules()->published()->with(['lessons' => fn ($q) => $q->published()])->get();

        $lessonIds = $modules->flatMap(function (PathModule $m) {
            $lessons = $m->relationLoaded('lessons')
                ? $m->lessons
                : $m->lessons()->published()->get();

            return $lessons->pluck('id');
        })->all();

        if ($lessonIds === []) {
            return 0;
        }

        $done = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->count();

        return (int) floor(($done / count($lessonIds)) * 100);
    }

    /**
     * Batch progress percents for a page of paths (avoids N+1 on list endpoints).
     *
     * @param  iterable<Path>  $paths
     * @return array<int, int> path_id => percent
     */
    public function progressPercentsFor(User $user, iterable $paths): array
    {
        $paths = collect($paths)->values();
        if ($paths->isEmpty()) {
            return [];
        }

        $pathIds = $paths->pluck('id')->all();
        $lessonRows = Lesson::query()
            ->published()
            ->whereHas('module', fn ($q) => $q->whereIn('path_id', $pathIds)->where('is_published', true))
            ->with('module:id,path_id')
            ->get(['id', 'module_id']);

        $lessonsByPath = [];
        foreach ($lessonRows as $lesson) {
            $pid = (int) $lesson->module->path_id;
            $lessonsByPath[$pid][] = (int) $lesson->id;
        }

        $allLessonIds = $lessonRows->pluck('id')->all();
        $completed = $allLessonIds === []
            ? collect()
            : LessonCompletion::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_id', $allLessonIds)
                ->pluck('lesson_id')
                ->flip();

        $out = [];
        foreach ($pathIds as $pathId) {
            $ids = $lessonsByPath[$pathId] ?? [];
            if ($ids === []) {
                $out[$pathId] = 0;

                continue;
            }
            $done = 0;
            foreach ($ids as $lid) {
                if ($completed->has($lid)) {
                    $done++;
                }
            }
            $out[$pathId] = (int) floor(($done / count($ids)) * 100);
        }

        return $out;
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
