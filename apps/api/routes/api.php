<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AchievementController;
use App\Http\Controllers\Api\V1\Admin\AdminAchievementController;
use App\Http\Controllers\Api\V1\Admin\AdminAuditLogController;
use App\Http\Controllers\Api\V1\Admin\AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\AdminChallengeController;
use App\Http\Controllers\Api\V1\Admin\AdminChallengeFileController;
use App\Http\Controllers\Api\V1\Admin\AdminChallengeFlagController;
use App\Http\Controllers\Api\V1\Admin\AdminChallengeHintController;
use App\Http\Controllers\Api\V1\Admin\AdminLessonController;
use App\Http\Controllers\Api\V1\Admin\AdminModuleController;
use App\Http\Controllers\Api\V1\Admin\AdminPathController;
use App\Http\Controllers\Api\V1\Admin\AdminQuizController;
use App\Http\Controllers\Api\V1\Admin\AdminStatsController;
use App\Http\Controllers\Api\V1\Admin\AdminTagController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\ChallengeFileController;
use App\Http\Controllers\Api\V1\ChallengeHintController;
use App\Http\Controllers\Api\V1\ChallengeSubmissionController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\LessonController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\ModuleController;
use App\Http\Controllers\Api\V1\PathController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\QuizController;
use App\Http\Controllers\Api\V1\TagController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Catch The Flag API — /api/v1
|--------------------------------------------------------------------------
| Controllers stay thin. Authorization is enforced by Policies + role middleware.
| Flag plaintext never leaves the Actions/Services layer.
*/

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::get('/health', HealthController::class)->name('health')->withoutMiddleware('throttle:api');

    // --- Auth (rate-limited) ---
    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('throttle:register');
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:login');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle:3,60');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])
            ->middleware('throttle:3,60');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/logout-all', [AuthController::class, 'logoutAll']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // --- Public taxonomy ---
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/tags', [TagController::class, 'index']);

    // --- Public / optional-auth content ---
    Route::get('/paths', [PathController::class, 'index']);
    Route::get('/paths/{path}', [PathController::class, 'show']);
    Route::get('/challenges', [ChallengeController::class, 'index']);
    Route::get('/challenges/{challenge}', [ChallengeController::class, 'show']);
    Route::get('/challenges/{challenge}/solves', [ChallengeController::class, 'solves']);
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);

    // --- Authenticated ---
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

        Route::post('/paths/{path}/start', [PathController::class, 'start']);
        Route::get('/paths/{path}/progress', [PathController::class, 'progress']);

        Route::get('/modules/{module}', [ModuleController::class, 'show']);
        Route::get('/lessons/{lesson}', [LessonController::class, 'show']);
        Route::post('/lessons/{lesson}/complete', [LessonController::class, 'complete']);

        Route::get('/challenges/{challenge}/files/{file}', [ChallengeFileController::class, 'download'])
            ->middleware('throttle:'.config('ctf.rate_limits.download_per_minute').',1');
        Route::post('/challenges/{challenge}/hints/{hint}/unlock', [ChallengeHintController::class, 'unlock']);
        Route::post('/challenges/{challenge}/submissions', [ChallengeSubmissionController::class, 'store'])
            ->middleware(['throttle:submit-user', 'throttle:submit-challenge']);

        Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
        Route::post('/quizzes/{quiz}/attempts', [QuizController::class, 'startAttempt']);
        Route::post('/quiz-attempts/{attempt}/answer', [QuizController::class, 'answer']);
        Route::post('/quiz-attempts/{attempt}/submit', [QuizController::class, 'submit']);
        Route::get('/quiz-attempts/{attempt}', [QuizController::class, 'showAttempt']);

        Route::get('/leaderboard/me', [LeaderboardController::class, 'me']);

        Route::prefix('me')->group(function (): void {
            Route::get('/progress', [MeController::class, 'progress']);
            Route::get('/solves', [MeController::class, 'solves']);
            Route::get('/xp-ledger', [MeController::class, 'xpLedger']);
            Route::get('/achievements', [MeController::class, 'achievements']);
            Route::get('/notifications', [MeController::class, 'notifications']);
            Route::post('/notifications/{id}/read', [MeController::class, 'readNotification']);
            Route::post('/notifications/read-all', [MeController::class, 'readAllNotifications']);
            Route::get('/settings', [MeController::class, 'settings']);
            Route::put('/settings', [MeController::class, 'updateSettings']);
        });

        Route::get('/achievements', [AchievementController::class, 'index']);
    });

    // --- Admin (role middleware + policies) ---
    Route::prefix('admin')
        ->middleware(['auth:sanctum', 'role:moderator,admin', 'throttle:'.config('ctf.rate_limits.admin_per_minute').',1'])
        ->group(function (): void {
            Route::get('/stats', [AdminStatsController::class, 'index']);
            Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);

            Route::apiResource('categories', AdminCategoryController::class);
            Route::apiResource('tags', AdminTagController::class)->except(['show', 'update']);
            Route::apiResource('achievements', AdminAchievementController::class);

            Route::apiResource('paths', AdminPathController::class);
            Route::post('/paths/{path}/publish', [AdminPathController::class, 'publish']);
            Route::post('/paths/{path}/unpublish', [AdminPathController::class, 'unpublish']);
            Route::post('/paths/{path}/archive', [AdminPathController::class, 'archive']);
            Route::post('/paths/{path}/review', [AdminPathController::class, 'review']);
            Route::post('/paths/{path}/modules', [AdminModuleController::class, 'store']);
            Route::put('/modules/{module}', [AdminModuleController::class, 'update']);
            Route::delete('/modules/{module}', [AdminModuleController::class, 'destroy']);
            Route::post('/modules/{module}/lessons', [AdminLessonController::class, 'store']);
            Route::put('/lessons/{lesson}', [AdminLessonController::class, 'update']);
            Route::delete('/lessons/{lesson}', [AdminLessonController::class, 'destroy']);
            Route::post('/lessons/{lesson}/challenges', [AdminLessonController::class, 'linkChallenge']);
            Route::delete('/lessons/{lesson}/challenges/{challenge}', [AdminLessonController::class, 'unlinkChallenge']);

            Route::apiResource('challenges', AdminChallengeController::class);
            Route::post('/challenges/{challenge}/publish', [AdminChallengeController::class, 'publish']);
            Route::post('/challenges/{challenge}/unpublish', [AdminChallengeController::class, 'unpublish']);
            Route::post('/challenges/{challenge}/archive', [AdminChallengeController::class, 'archive']);
            Route::post('/challenges/{challenge}/review', [AdminChallengeController::class, 'review']);
            Route::post('/challenges/{challenge}/preview', [AdminChallengeController::class, 'preview']);

            Route::get('/challenges/{challenge}/files', [AdminChallengeFileController::class, 'index']);
            Route::post('/challenges/{challenge}/files', [AdminChallengeFileController::class, 'store']);
            Route::put('/challenges/{challenge}/files/{file}', [AdminChallengeFileController::class, 'replace']);
            Route::delete('/challenges/{challenge}/files/{file}', [AdminChallengeFileController::class, 'destroy']);

            Route::get('/challenges/{challenge}/hints', [AdminChallengeHintController::class, 'index']);
            Route::post('/challenges/{challenge}/hints', [AdminChallengeHintController::class, 'store']);
            Route::put('/challenges/{challenge}/hints/{hint}', [AdminChallengeHintController::class, 'update']);
            Route::delete('/challenges/{challenge}/hints/{hint}', [AdminChallengeHintController::class, 'destroy']);

            Route::get('/challenges/{challenge}/flags', [AdminChallengeFlagController::class, 'index']);
            Route::post('/challenges/{challenge}/flags', [AdminChallengeFlagController::class, 'store']);
            Route::put('/challenges/{challenge}/flags/{flag}', [AdminChallengeFlagController::class, 'update']);
            Route::delete('/challenges/{challenge}/flags/{flag}', [AdminChallengeFlagController::class, 'destroy']);

            Route::apiResource('quizzes', AdminQuizController::class);
            Route::post('/quizzes/{quiz}/questions', [AdminQuizController::class, 'storeQuestion']);
            Route::put('/quizzes/{quiz}/questions/{question}', [AdminQuizController::class, 'updateQuestion']);
            Route::delete('/quizzes/{quiz}/questions/{question}', [AdminQuizController::class, 'destroyQuestion']);

            Route::middleware('role:admin')->group(function (): void {
                Route::get('/users', [AdminUserController::class, 'index']);
                Route::get('/users/{user}', [AdminUserController::class, 'show']);
                Route::put('/users/{user}', [AdminUserController::class, 'update']);
                Route::put('/users/{user}/role', [AdminUserController::class, 'updateRole']);
                Route::post('/users/{user}/ban', [AdminUserController::class, 'ban']);
                Route::post('/users/{user}/unban', [AdminUserController::class, 'unban']);
                Route::post('/users/{user}/xp', [AdminUserController::class, 'adjustXp']);
            });
        });
});
