<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

        $storage = 'down';
        try {
            $disk = Storage::disk('challenge-files');
            // Existence probe only — never list or expose object keys.
            $disk->exists('.healthcheck');
            $storage = 'up';
        } catch (\Throwable) {
            $storage = 'down';
        }

        $ok = $db === 'up' && $storage === 'up';

        return response()->json([
            'data' => [
                'status' => $ok ? 'ok' : 'degraded',
                'version' => config('app.version', '1.0.0'),
                'db' => $db,
                'storage' => $storage,
                'time' => now()->toIso8601String(),
            ],
        ], $ok ? 200 : 503);
    }
}
