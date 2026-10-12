<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (prefix: /api)
|--------------------------------------------------------------------------
|
| The browser only talks to the Next.js BFF, which proxies to Laravel at
| /api/v1/*. Route files are grouped by API version below.
|
*/

Route::prefix('v1')->group(function (): void {
    // Auth, challenges, paths, leaderboard, admin … land here as the
    // corresponding controllers/actions are implemented.

    Route::middleware('throttle:register')->group(function (): void {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    });

    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware(['auth:sanctum', 'banned'])->group(function (): void {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    });
});
