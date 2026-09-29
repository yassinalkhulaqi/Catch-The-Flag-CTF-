<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\ProgressService;

final class CompleteLessonAction
{
    public function __construct(
        private ProgressService $progress,
        private AchievementService $achievements,
    ) {}

    public function handle(User $user, Lesson $lesson): LessonCompletion
    {
        $completion = $this->progress->completeLesson($user, $lesson);
        $this->achievements->evaluate($user->fresh());

        return $completion;
    }
}
