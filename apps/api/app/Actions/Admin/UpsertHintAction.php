<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Challenge;
use App\Models\ChallengeHint;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Create or update a hint. Hint content is staff-authored material, so
 * admins see it in full here; learners only receive it through the
 * unlock endpoint.
 */
class UpsertHintAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = ['challenge_id', 'content', 'cost_points', 'position'];

    /**
     * @param  array<string, mixed>  $data  Validated hint fields.
     */
    public function execute(User $actor, Challenge $challenge, ?ChallengeHint $hint, array $data, Request $request): ChallengeHint
    {
        return DB::transaction(function () use ($actor, $challenge, $hint, $data, $request): ChallengeHint {
            if ($hint === null) {
                $model = new ChallengeHint;
                $model->forceFill(['challenge_id' => $challenge->id]);
                $model->fill($data);
                $before = null;
                $model->save();
                $auditAction = 'hint.created';
            } else {
                $model = $hint;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'hint.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                ChallengeHint::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }
}
