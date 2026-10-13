<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Path;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Create or update a learning path's scalar fields. `status` is never
 * accepted here — only TransitionPathAction may change it.
 */
class UpsertPathAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = [
        'title', 'slug', 'summary', 'description', 'thumbnail_path',
        'category_id', 'difficulty', 'estimated_minutes', 'status',
    ];

    /**
     * @param  array<string, mixed>  $data  Validated path fields.
     */
    public function execute(User $actor, ?Path $path, array $data, Request $request): Path
    {
        return DB::transaction(function () use ($actor, $path, $data, $request): Path {
            if ($path === null) {
                $model = new Path;
                $model->forceFill(['created_by' => $actor->id]);
                $model->fill($data);

                if ($model->getAttribute('slug') === null || $model->getAttribute('slug') === '') {
                    $model->forceFill(['slug' => $this->uniqueSlug((string) $model->getAttribute('title'))]);
                }

                $before = null;
                $model->save();
                $auditAction = 'path.created';
            } else {
                $model = $path;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'path.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                Path::class,
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
            $base = 'path';
        }

        do {
            $slug = substr($base, 0, 140).'-'.random_int(10000, 99999);
        } while (Path::where('slug', $slug)->exists());

        return $slug;
    }
}
