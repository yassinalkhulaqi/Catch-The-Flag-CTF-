<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Path;
use App\Models\PathModule;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Create or update a module inside a path. The parent path is always
 * taken from the route — never from request input.
 */
class UpsertModuleAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = ['path_id', 'title', 'description', 'position', 'is_published'];

    /**
     * @param  array<string, mixed>  $data  Validated module fields.
     */
    public function execute(User $actor, Path $path, ?PathModule $module, array $data, Request $request): PathModule
    {
        return DB::transaction(function () use ($actor, $path, $module, $data, $request): PathModule {
            if ($module === null) {
                $model = new PathModule;
                $model->forceFill(['path_id' => $path->id]);
                $model->fill($data);
                $before = null;
                $model->save();
                $auditAction = 'module.created';
            } else {
                $model = $module;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'module.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                PathModule::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }
}
