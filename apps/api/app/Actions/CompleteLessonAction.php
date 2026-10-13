<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\XpReason;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;
use App\Services\AchievementEvaluator;
use App\Services\ProgressCalculator;
use App\Services\XpAwarder;
use Illuminate\Support\Facades\DB;

/**
 * Explicit lesson completion (docs/database.md §8). XP is awarded once:
 * repeats return the existing row with no further reward.
 *
 * @return array{completed: bool, already_completed: bool}
 */
class CompleteLessonAction
{
    public function __construct(
        private readonly XpAwarder $xp,
        private readonly ProgressCalculator $progress,
        private readonly AchievementEvaluator $achievements,
    ) {}

    /**
     * @return array{completed: bool, already_completed: bool}
     */
    public function execute(User $user, Lesson $lesson): array
    {
        return DB::transaction(function () use ($user, $lesson): array {
            $existing = LessonCompletion::query()
                ->where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->first();

            if ($existing !== null) {
                return ['completed' => true, 'already_completed' => true];
            }

            LessonCompletion::forceCreate([
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'completed_at' => now(),
            ]);

            $this->xp->award(
                $user,
                (int) config('ctf.xp.lesson_complete'),
                XpReason::LessonComplete,
                Lesson::class,
                $lesson->id,
            );

            $fresh = $user->refresh();
            $this->progress->recomputeForUser($fresh);
            $this->achievements->evaluate($fresh);

            return ['completed' => true, 'already_completed' => false];
        });
    }
}
