<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteModelAction;
use App\Actions\Admin\UpsertModuleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ModuleRequest;
use App\Http\Resources\Admin\AdminModuleResource;
use App\Models\Path;
use App\Models\PathModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff module management nested under paths.
 */
class ModuleController extends Controller
{
    public function index(Path $path): JsonResponse
    {
        $modules = $path->modules()->orderBy('position')->orderBy('id')->get();

        return response()->json(['data' => AdminModuleResource::collection($modules)]);
    }

    public function store(ModuleRequest $request, Path $path, UpsertModuleAction $action): JsonResponse
    {
        $module = $action->execute($request->user(), $path, null, $request->validated(), $request);

        return response()->json(['data' => new AdminModuleResource($module)], 201);
    }

    public function show(PathModule $module): AdminModuleResource
    {
        $module->load(['lessons']);

        return new AdminModuleResource($module);
    }

    public function update(ModuleRequest $request, PathModule $module, UpsertModuleAction $action): AdminModuleResource
    {
        // The parent path is immutable after creation; only scalar fields change.
        return new AdminModuleResource($action->execute($request->user(), $module->path, $module, $request->validated(), $request));
    }

    public function destroy(Request $request, PathModule $module, DeleteModelAction $action): JsonResponse
    {
        $action->execute($request->user(), $module, $request, 'module.deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }
}
