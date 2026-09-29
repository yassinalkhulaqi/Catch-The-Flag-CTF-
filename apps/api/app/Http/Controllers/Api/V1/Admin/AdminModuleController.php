<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreModuleRequest;
use App\Http\Resources\ModuleResource;
use App\Models\Path;
use App\Models\PathModule;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminModuleController extends Controller
{
    public function store(StoreModuleRequest $request, Path $path, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $path);
        $module = $path->modules()->create($request->validated());
        $audit->log($request->user(), 'module.create', $module, $request->validated());

        return response()->json(['data' => new ModuleResource($module)], 201);
    }

    public function update(StoreModuleRequest $request, PathModule $module, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $module);
        $module->fill($request->validated())->save();
        $audit->log($request->user(), 'module.update', $module, $request->validated());

        return response()->json(['data' => new ModuleResource($module)]);
    }

    public function destroy(Request $request, PathModule $module, AuditLogger $audit): JsonResponse
    {
        $this->authorize('delete', $module);
        $audit->log($request->user(), 'module.delete', $module, ['id' => $module->id]);
        $module->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
