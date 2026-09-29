<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $db = 'down';
        try {
            DB::select('select 1');
            $db = 'up';
        } catch (\Throwable) {
            $db = 'down';
        }

        return response()->json([
            'data' => [
                'status' => $db === 'up' ? 'ok' : 'degraded',
                'version' => config('app.version', '1.0.0'),
                'db' => $db,
                'time' => now()->toIso8601String(),
            ],
        ]);
    }
}
