<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Create or update a quiz question. The parent quiz comes from the route.
 */
class UpsertQuestionAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = [
        'quiz_id', 'question', 'type', 'explanation', 'points', 'position', 'is_published',
    ];

    /**
     * @param  array<string, mixed>  $data  Validated question fields.
     */
    public function execute(User $actor, Quiz $quiz, ?QuizQuestion $question, array $data, Request $request): QuizQuestion
    {
        return DB::transaction(function () use ($actor, $quiz, $question, $data, $request): QuizQuestion {
            if ($question === null) {
                $model = new QuizQuestion;
                $model->forceFill(['quiz_id' => $quiz->id]);
                $model->fill($data);
                $before = null;
                $model->save();
                $auditAction = 'quiz_question.created';
            } else {
                $model = $question;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'quiz_question.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                QuizQuestion::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }
}
