<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AuditLogIndexRequest;
use App\Http\Resources\Admin\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only audit trail (admin-only). Filterable by action, actor, and
 * audited entity; newest first.
 */
class AuditLogController extends Controller
{
    public function index(AuditLogIndexRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();

        $query = AuditLog::query()->with(['actor'])->latest('id');

        foreach (['action', 'actor_id', 'auditable_type', 'auditable_id'] as $field) {
            if (isset($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        return AuditLogResource::collection($query->paginate($filters['per_page'] ?? 20));
    }
}
