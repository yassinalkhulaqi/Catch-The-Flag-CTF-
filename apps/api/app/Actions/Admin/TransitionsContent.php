<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\ContentStatus;
use App\Models\Challenge;
use App\Models\Path;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Shared publish-workflow engine for Challenge and Path. Transitions are
 * validated against ContentStatus::transitions() from the current status;
 * illegal moves are 409 (state conflict, docs/api.md §1.1). Publishing
 * stamps published_at; returning to draft clears it.
 */
trait TransitionsContent
{
    /**
     * @return ($model is Challenge ? Challenge : Path)
     */
    protected function transition(
        User $actor,
        Challenge|Path $model,
        ContentStatus $to,
        Request $request,
        string $auditPrefix,
    ): Challenge|Path {
        return DB::transaction(function () use ($actor, $model, $to, $request, $auditPrefix): Challenge|Path {
            $raw = $model->getAttribute('status');
            $from = $raw instanceof ContentStatus ? $raw : ContentStatus::from((string) $raw);

            $before = ['status' => $from->value, 'published_at' => $model->getAttribute('published_at')?->toISOString()];

            if ($from !== $to) {
                if (! in_array($to, $from->transitions(), true)) {
                    throw new HttpException(409, "Cannot transition from {$from->value} to {$to->value}.");
                }

                $model->forceFill(['status' => $to->value]);

                if ($to === ContentStatus::Published) {
                    $model->forceFill(['published_at' => now()]);
                } elseif ($to === ContentStatus::Draft) {
                    $model->forceFill(['published_at' => null]);
                }

                $model->save();
                $model->refresh();
            }

            AuditLogger::log(
                $actor,
                "{$auditPrefix}.transition",
                $model::class,
                $model->id,
                ['before' => $before, 'after' => ['status' => $to->value, 'published_at' => $model->getAttribute('published_at')?->toISOString()]],
                $request,
            );

            return $model;
        });
    }
}
