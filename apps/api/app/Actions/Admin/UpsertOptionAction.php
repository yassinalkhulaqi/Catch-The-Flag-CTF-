<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Create or update a quiz question option. `is_correct` is not fillable
 * (learners must never set it via mass assignment), so it is written
 * via forceFill from validated data only.
 */
class UpsertOptionAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = ['question_id', 'option_text', 'is_correct', 'position'];

    /**
     * @param  array<string, mixed>  $data  Validated option fields.
     */
    public function execute(User $actor, QuizQuestion $question, ?QuizOption $option, array $data, Request $request): QuizOption
    {
        return DB::transaction(function () use ($actor, $question, $option, $data, $request): QuizOption {
            if ($option === null) {
                $model = new QuizOption;
                $model->forceFill(['question_id' => $question->id]);
                $model->fill($data);
                if (array_key_exists('is_correct', $data)) {
                    $model->forceFill(['is_correct' => (bool) $data['is_correct']]);
                }
                $before = null;
                $model->save();
                $auditAction = 'quiz_option.created';
            } else {
                $model = $option;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                if (array_key_exists('is_correct', $data)) {
                    $model->forceFill(['is_correct' => (bool) $data['is_correct']]);
                }
                $model->save();
                $auditAction = 'quiz_option.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                QuizOption::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }
}
