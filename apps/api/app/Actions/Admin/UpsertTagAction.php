<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Tag;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Create or update a taxonomy tag.
 */
class UpsertTagAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = ['name', 'slug'];

    /**
     * @param  array<string, mixed>  $data  Validated tag fields.
     */
    public function execute(User $actor, ?Tag $tag, array $data, Request $request): Tag
    {
        return DB::transaction(function () use ($actor, $tag, $data, $request): Tag {
            if ($tag === null) {
                $model = new Tag;
                $model->fill($data);

                if ($model->getAttribute('slug') === null || $model->getAttribute('slug') === '') {
                    $model->fill(['slug' => $this->uniqueSlug((string) $model->getAttribute('name'))]);
                }

                $before = null;
                $model->save();
                $auditAction = 'tag.created';
            } else {
                $model = $tag;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'tag.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                Tag::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'tag';
        }

        do {
            $slug = substr($base, 0, 60).'-'.random_int(10000, 99999);
        } while (Tag::where('slug', $slug)->exists());

        return $slug;
    }
}
