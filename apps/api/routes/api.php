<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\ChallengeFileController;
use App\Http\Controllers\Api\V1\HintUnlockController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\LessonController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\ModuleController;
use App\Http\Controllers\Api\V1\PathController;
use App\Http\Controllers\Api\V1\PathProgressController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\QuizAttemptController;
use App\Http\Controllers\Api\V1\QuizController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Controllers\Api\V1\TagController;
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

    // Public content catalog (Phase 2). `optional-auth` resolves a
    // bearer token when present (per-viewer solved/progress fields)
    // without ever rejecting guests; `banned` still locks out
    // suspended accounts.
    Route::middleware(['optional-auth', 'banned', 'throttle:api'])->group(function (): void {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/tags', [TagController::class, 'index']);
        Route::get('/challenges', [ChallengeController::class, 'index']);
        Route::get('/challenges/{challenge}', [ChallengeController::class, 'show']);
        Route::get('/challenges/{challenge}/files/{file}/download', [ChallengeFileController::class, 'download'])
            ->middleware('throttle:download');
        Route::get('/paths', [PathController::class, 'index']);
        Route::get('/paths/{path}', [PathController::class, 'show']);
        Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    });

    Route::middleware(['auth:sanctum', 'banned'])->group(function (): void {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::get('/leaderboard/me', [LeaderboardController::class, 'me']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

        Route::post('/paths/{path}/start', [PathProgressController::class, 'start']);
        Route::get('/paths/{path}/progress', [PathProgressController::class, 'show']);
        Route::get('/modules/{module}', [ModuleController::class, 'show']);
        Route::get('/lessons/{lesson}', [LessonController::class, 'show']);
        Route::post('/lessons/{lesson}/complete', [LessonController::class, 'complete']);
        Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
        Route::post('/quizzes/{quiz}/attempts', [QuizController::class, 'startAttempt']);
        Route::get('/quiz-attempts/{attempt}', [QuizAttemptController::class, 'show']);
        Route::post('/quiz-attempts/{attempt}/answer', [QuizAttemptController::class, 'answer']);
        Route::post('/quiz-attempts/{attempt}/submit', [QuizAttemptController::class, 'submit']);

        Route::get('/me/progress', [MeController::class, 'progress']);
        Route::get('/me/solves', [MeController::class, 'solves']);
        Route::get('/me/xp-ledger', [MeController::class, 'xpLedger']);
        Route::get('/me/achievements', [MeController::class, 'achievements']);
        Route::get('/me/notifications', [MeController::class, 'notifications']);
        Route::post('/me/notifications/{id}/read', [MeController::class, 'readNotification']);
        Route::post('/me/notifications/read-all', [MeController::class, 'readAllNotifications']);

        Route::post('/challenges/{challenge}/hints/{hint}/unlock', [HintUnlockController::class, 'store']);
        Route::post('/challenges/{challenge}/submissions', [SubmissionController::class, 'store'])
            ->middleware(['throttle:submission-user', 'throttle:submission-challenge']);
    });
});
