<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Challenge;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Create or update a challenge's scalar fields. Only validated data
 * reaches the model; `status` changes exclusively through
 * TransitionChallengeAction and flag material exclusively through
 * SetChallengeFlagAction — neither is fillable, so fill() cannot
 * touch them even if a caller passes them.
 */
class UpsertChallengeAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = [
        'title', 'slug', 'description', 'scenario', 'category_id',
        'difficulty', 'points', 'estimated_minutes', 'flag_validation_type',
        'max_attempts', 'status',
    ];

    /**
     * @param  array<string, mixed>  $data  Validated challenge fields (+ optional tag_ids).
     */
    public function execute(User $actor, ?Challenge $challenge, array $data, Request $request): Challenge
    {
        return DB::transaction(function () use ($actor, $challenge, $data, $request): Challenge {
            $tagIds = Arr::pull($data, 'tag_ids');

            if ($challenge === null) {
                $model = new Challenge;
                $model->forceFill(['author_id' => $actor->id]);
                $model->fill($data);

                if ($model->getAttribute('slug') === null || $model->getAttribute('slug') === '') {
                    $model->forceFill(['slug' => $this->uniqueSlug((string) $model->getAttribute('title'))]);
                }

                $before = null;
                $model->save();
                $auditAction = 'challenge.created';
            } else {
                $model = $challenge;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'challenge.updated';
            }

            if (is_array($tagIds)) {
                $model->tags()->sync($tagIds);
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                Challenge::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);

        if ($base === '') {
            $base = 'challenge';
        }

        do {
            $slug = substr($base, 0, 140).'-'.random_int(10000, 99999);
        } while (Challenge::where('slug', $slug)->exists());

        return $slug;
    }
}
