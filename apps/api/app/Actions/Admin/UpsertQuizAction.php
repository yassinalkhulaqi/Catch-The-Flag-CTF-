<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Lesson;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Create or update a quiz. The parent (exactly one of module/lesson,
 * per the quizzes_parent_xor CHECK) comes from the route. Updates never
 * move a quiz between parents.
 */
class UpsertQuizAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = [
        'title', 'description', 'pass_score', 'position',
        'is_published', 'module_id', 'lesson_id',
    ];

    /**
     * @param  array<string, mixed>  $data  Validated quiz fields.
     */
    public function execute(
        User $actor,
        ?PathModule $module,
        ?Lesson $lesson,
        ?Quiz $quiz,
        array $data,
        Request $request,
    ): Quiz {
        return DB::transaction(function () use ($actor, $module, $lesson, $quiz, $data, $request): Quiz {
            if ($quiz === null) {
                if (($module === null) === ($lesson === null)) {
                    throw new HttpException(400, 'A quiz must belong to exactly one module or lesson.');
                }

                $model = new Quiz;
                $model->forceFill([
                    'module_id' => $module?->id,
                    'lesson_id' => $lesson?->id,
                ]);
                $model->fill($data);
                $before = null;
                $model->save();
                $auditAction = 'quiz.created';
            } else {
                $model = $quiz;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'quiz.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                Quiz::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }
}
