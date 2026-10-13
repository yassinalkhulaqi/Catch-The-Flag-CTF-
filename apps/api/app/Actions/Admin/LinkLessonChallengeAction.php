<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Attach/detach challenges to lessons (many-to-many, docs/database.md).
 * Both sides must exist; attach is idempotent.
 */
class LinkLessonChallengeAction
{
    public function execute(User $actor, Lesson $lesson, Challenge $challenge, Request $request): void
    {
        DB::transaction(function () use ($actor, $lesson, $challenge, $request): void {
            $lesson->challenges()->syncWithoutDetaching([$challenge->id]);

            AuditLogger::log(
                $actor,
                'lesson_challenge.attached',
                Lesson::class,
                $lesson->id,
                ['before' => null, 'after' => ['lesson_id' => $lesson->id, 'challenge_id' => $challenge->id]],
                $request,
            );
        });
    }

    public function detach(User $actor, Lesson $lesson, Challenge $challenge, Request $request): void
    {
        DB::transaction(function () use ($actor, $lesson, $challenge, $request): void {
            $lesson->challenges()->detach($challenge->id);

            AuditLogger::log(
                $actor,
                'lesson_challenge.detached',
                Lesson::class,
                $lesson->id,
                ['before' => ['lesson_id' => $lesson->id, 'challenge_id' => $challenge->id], 'after' => null],
                $request,
            );
        });
    }
}
