<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\HealthCheckService;
use Illuminate\Http\JsonResponse;

/**
 * Health probes (docs/architecture.md §7 Observability).
 *
 * - `show`/`live`  — liveness: the process is up. Cheap, no I/O.
 * - `ready`        — readiness: the instance can still serve traffic. Probes
 *                    the database, the cache and the challenge-artifact disk.
 *
 * Nothing here exposes configuration, environment or stack detail.
 */
class HealthController extends Controller
{
    public function __construct(private readonly HealthCheckService $health) {}

    /**
     * Liveness probe. The shape is unchanged from the original status route.
     */
    public function show(): JsonResponse
    {
        return response()->json(['data' => [
            'status' => 'ok',
            'version' => $this->version(),
        ]]);
    }

    /**
     * Liveness probe under the name orchestrators expect.
     */
    public function live(): JsonResponse
    {
        return $this->show();
    }

    /**
     * Readiness probe: 200 when every dependency answers, 503 otherwise.
     */
    public function ready(): JsonResponse
    {
        $checks = $this->health->checks();
        $ready = $this->health->isReady($checks);

        return response()->json(['data' => [
            'status' => $ready ? 'ok' : 'degraded',
            'version' => $this->version(),
            'checks' => $checks,
        ]], $ready ? 200 : 503);
    }

    private function version(): string
    {
        return (string) config('app.version');
    }
}
