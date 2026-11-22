<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\ContentStatus;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\Quiz;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Deep-clone a learning path: the path, its modules, lessons, linked
 * challenges, and quizzes (questions and options included). The clone lands
 * in draft; content appears for learners only after publishing.
 *
 * Prerequisites (path_prerequisites) are intentionally not cloned.
 */
class DuplicatePathAction
{
    public function execute(User $actor, Path $source, Request $request): Path
    {
        return DB::transaction(function () use ($actor, $source, $request): Path {
            $copy = $source->replicate(except: [
                'slug', 'status', 'published_at',
            ]);

            $copy->title = $source->title.' (Copy)';
            $copy->slug = $this->uniqueSlug($copy->title);
            $copy->status = ContentStatus::Draft->value;
            $copy->published_at = null;
            $copy->save();

            foreach ($source->modules as $module) {
                $newModule = $module->replicate(except: [
                    'path_id',
                ]);
                $newModule->path_id = $copy->id;
                $newModule->save();

                $this->cloneQuizzesFor($actor, $module->quizzes, $newModule->id, null);

                foreach ($module->lessons as $lesson) {
                    $newLesson = $lesson->replicate(except: [
                        'module_id', 'slug',
                    ]);
                    $newLesson->module_id = $newModule->id;
                    $newLesson->slug = $lesson->slug;
                    $newLesson->save();

                    $newLesson->challenges()->syncWithoutDetaching(
                        $lesson->challenges()->pluck('challenges.id')->all(),
                    );

                    $this->cloneQuizzesFor($actor, $lesson->quizzes, null, $newLesson->id);
                }
            }

            AuditLogger::log(
                $actor,
                'path.duplicated',
                Path::class,
                $copy->id,
                ['before' => null, 'after' => ['slug' => $copy->slug, 'title' => $copy->title, 'source_id' => $source->id]],
                $request,
            );

            return $copy;
        });
    }

    /**
     * Clone every quiz in the collection onto the new parent (module or lesson).
     *
     * @param  iterable<Quiz>  $quizzes
     */
    private function cloneQuizzesFor(User $actor, iterable $quizzes, ?int $moduleId, ?int $lessonId): void
    {
        foreach ($quizzes as $quiz) {
            $newQuiz = $quiz->replicate(except: [
                'module_id', 'lesson_id',
            ]);
            $newQuiz->module_id = $moduleId;
            $newQuiz->lesson_id = $lessonId;
            $newQuiz->save();

            foreach ($quiz->questions as $question) {
                $newQuestion = $question->replicate(except: [
                    'quiz_id',
                ]);
                $newQuestion->quiz_id = $newQuiz->id;
                $newQuestion->save();

                foreach ($question->options as $option) {
                    $newOption = $option->replicate(except: [
                        'question_id',
                    ]);
                    $newOption->question_id = $newQuestion->id;
                    $newOption->save();
                }
            }
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = substr(strtolower((string) preg_replace('/[^a-z0-9]+/', '-', $title)), 0, 120);

        if ($base === '' || $base === '-') {
            $base = 'path-copy';
        }

        do {
            $slug = rtrim($base, '-').'-'.random_int(10000, 99999);
        } while (Path::where('slug', $slug)->exists());

        return $slug;
    }
}
