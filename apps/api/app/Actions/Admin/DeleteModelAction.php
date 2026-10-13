<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Generic hard/soft delete with audit. Used for simple content rows
 * (categories, tags, hints, flags, modules, lessons, quizzes,
 * questions, options) so every destructive mutation is audited without
 * one action class per model. Challenges/paths archive via their
 * transition actions instead; files have their own action (disk
 * cleanup); users are banned, never deleted.
 */
class DeleteModelAction
{
    public function execute(User $actor, Model $model, Request $request, string $auditAction): void
    {
        DB::transaction(function () use ($actor, $model, $request, $auditAction): void {
            $before = $model->attributesToArray();
            $modelId = (int) $model->getKey();
            $modelClass = $model::class;

            // Never leak flag material or storage internals into the trail.
            unset($before['flag_ciphertext'], $before['flag_hash'], $before['storage_key']);

            try {
                $model->delete();
            } catch (QueryException $e) {
                throw new HttpException(409, 'This record is still referenced and cannot be deleted.');
            }

            AuditLogger::log(
                $actor,
                $auditAction,
                $modelClass,
                $modelId,
                ['before' => $before, 'after' => null],
                $request,
            );
        });
    }
}
