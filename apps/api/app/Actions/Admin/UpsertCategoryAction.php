<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Category;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Create or update a taxonomy category (data-driven, ADR-0005).
 */
class UpsertCategoryAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = ['name', 'slug', 'description', 'color', 'icon', 'sort_order', 'is_active'];

    /**
     * @param  array<string, mixed>  $data  Validated category fields.
     */
    public function execute(User $actor, ?Category $category, array $data, Request $request): Category
    {
        return DB::transaction(function () use ($actor, $category, $data, $request): Category {
            if ($category === null) {
                $model = new Category;
                $model->fill($data);

                if ($model->getAttribute('slug') === null || $model->getAttribute('slug') === '') {
                    $model->fill(['slug' => $this->uniqueSlug((string) $model->getAttribute('name'))]);
                }

                $before = null;
                $model->save();
                $auditAction = 'category.created';
            } else {
                $model = $category;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'category.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                Category::class,
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
            $base = 'category';
        }

        do {
            $slug = substr($base, 0, 60).'-'.random_int(10000, 99999);
        } while (Category::where('slug', $slug)->exists());

        return $slug;
    }
}
