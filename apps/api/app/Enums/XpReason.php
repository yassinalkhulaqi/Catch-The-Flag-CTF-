<?php

namespace App\Enums;

enum XpReason: string
{
    case ChallengeSolve = 'challenge_solve';
    case QuizPass = 'quiz_pass';
    case LessonComplete = 'lesson_complete';
    case PathComplete = 'path_complete';
    case Achievement = 'achievement';
    case AdminAdjustment = 'admin_adjustment';

    public function description(): string
    {
        return match ($this) {
            self::ChallengeSolve => 'Challenge solved',
            self::QuizPass => 'Quiz passed',
            self::LessonComplete => 'Lesson completed',
            self::PathComplete => 'Path completed',
            self::Achievement => 'Achievement unlocked',
            self::AdminAdjustment => 'Manual adjustment',
        };
    }
}
