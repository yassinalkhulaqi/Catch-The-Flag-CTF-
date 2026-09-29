<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminAuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin() || $request->user()?->isModerator(), 403);

        $query = AuditLog::query()->with('actor')->orderByDesc('created_at');
        if ($request->filled('actor')) {
            $query->where('actor_id', (int) $request->integer('actor'));
        }
        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }
        if ($request->filled('entity')) {
            $query->where('auditable_type', $request->string('entity'));
        }

        $rows = $query->paginate(min(100, (int) $request->integer('per_page', 20)));

        return response()->json([
            'data' => AuditLogResource::collection($rows->items()),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
                'last_page' => $rows->lastPage(),
            ],
        ]);
    }
}
