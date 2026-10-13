<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\StartPathAction;
use App\Http\Controllers\Controller;
use App\Models\Path;
use App\Models\UserPathProgress;
use App\Services\ProgressCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Path enrollment + progress detail. Invisible paths are 404.
 */
class PathProgressController extends Controller
{
    public function start(Request $request, string $path, StartPathAction $action): JsonResponse
    {
        $model = $this->resolve($path);

        if ($model === null || Gate::denies('view', $model)) {
            abort(404);
        }

        $progress = $action->execute($request->user(), $model);

        return response()->json(['data' => [
            'path_id' => $progress->path_id,
            'status' => $progress->status->value,
            'started_at' => $progress->started_at?->toISOString(),
        ]], 201);
    }

    public function show(Request $request, string $path, ProgressCalculator $calculator): JsonResponse
    {
        $model = $this->resolve($path);

        if ($model === null || Gate::denies('view', $model)) {
            abort(404);
        }

        $user = $request->user();

        $progress = UserPathProgress::query()
            ->where('user_id', $user->id)
            ->where('path_id', $model->id)
            ->first();

        $modules = $model->modules()->where('is_published', true)->orderBy('position')->orderBy('id')->get();

        return response()->json(['data' => [
            'path_id' => $model->id,
            'status' => $progress?->status->value,
            'progress_percent' => $calculator->percentFor($user, $model),
            'modules' => $modules->map(fn ($module): array => [
                'id' => $module->id,
                'title' => $module->title,
                'completed' => $calculator->isModuleComplete($user, $module, $model),
            ])->values()->all(),
        ]]);
    }

    private function resolve(string $key): ?Path
    {
        $query = Path::query();

        if (ctype_digit($key)) {
            $query->where('id', (int) $key)->orWhere('slug', $key);
        } else {
            $query->where('slug', $key);
        }

        return $query->first();
    }
}
