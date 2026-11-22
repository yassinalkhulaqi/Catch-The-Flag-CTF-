<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Achievement;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Create or update an achievement badge with an audit trail. Criteria
 * shape is validated against the rules AchievementEvaluator runs
 * (docs/database.md §7).
 */
class UpsertAchievementAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = ['key', 'title', 'description', 'icon', 'criteria', 'points', 'is_active', 'sort_order'];

    /**
     * @param  array<string, mixed>  $data  Validated achievement fields.
     */
    public function execute(User $actor, ?Achievement $achievement, array $data, Request $request): Achievement
    {
        return DB::transaction(function () use ($actor, $achievement, $data, $request): Achievement {
            if ($achievement === null) {
                $model = new Achievement;
                $before = null;
                $auditAction = 'achievement.created';
            } else {
                $model = $achievement;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $auditAction = 'achievement.updated';
            }

            $model->fill($data)->save();
            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                Achievement::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }
}
