<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only audit trail (admin-only). Filterable by action, actor, and
 * audited entity; newest first.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'action' => ['sometimes', 'string', 'max:80'],
            'actor_id' => ['sometimes', 'integer', 'min:1'],
            'auditable_type' => ['sometimes', 'string', 'max:80'],
            'auditable_id' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = AuditLog::query()->with(['actor'])->latest('id');

        foreach (['action', 'actor_id', 'auditable_type', 'auditable_id'] as $field) {
            if (isset($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        return AuditLogResource::collection($query->paginate($filters['per_page'] ?? 20));
    }
}
