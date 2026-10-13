<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Version/status probe only — never config, env, or stack detail.
 */
class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => [
            'status' => 'ok',
            'version' => '1.0.0',
        ]]);
    }
}
