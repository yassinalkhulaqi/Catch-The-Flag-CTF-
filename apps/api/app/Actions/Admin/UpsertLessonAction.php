<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Lesson;
use App\Models\PathModule;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Create or update a lesson inside a module. The parent module comes
 * from the route — never from request input.
 */
class UpsertLessonAction
{
    /** @var list<string> */
    private const SNAPSHOT_KEYS = [
        'module_id', 'title', 'slug', 'summary', 'content',
        'position', 'estimated_minutes', 'is_published',
    ];

    /**
     * @param  array<string, mixed>  $data  Validated lesson fields.
     */
    public function execute(User $actor, PathModule $module, ?Lesson $lesson, array $data, Request $request): Lesson
    {
        return DB::transaction(function () use ($actor, $module, $lesson, $data, $request): Lesson {
            if ($lesson === null) {
                $model = new Lesson;
                $model->forceFill(['module_id' => $module->id]);
                $model->fill($data);

                if ($model->getAttribute('slug') === null || $model->getAttribute('slug') === '') {
                    $model->forceFill(['slug' => $this->uniqueSlug($module->id, (string) $model->getAttribute('title'))]);
                }

                $before = null;
                $model->save();
                $auditAction = 'lesson.created';
            } else {
                $model = $lesson;
                $before = Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS);
                $model->fill($data);
                $model->save();
                $auditAction = 'lesson.updated';
            }

            $model->refresh();

            AuditLogger::log(
                $actor,
                $auditAction,
                Lesson::class,
                $model->id,
                ['before' => $before, 'after' => Arr::only($model->attributesToArray(), self::SNAPSHOT_KEYS)],
                $request,
            );

            return $model;
        });
    }

    private function uniqueSlug(int $moduleId, string $title): string
    {
        $base = Str::slug($title);

        if ($base === '') {
            $base = 'lesson';
        }

        do {
            $slug = substr($base, 0, 140).'-'.random_int(10000, 99999);
        } while (Lesson::where('module_id', $moduleId)->where('slug', $slug)->exists());

        return $slug;
    }
}
