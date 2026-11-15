<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\AuditLogController as AdminAuditLogController;
use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\ChallengeController as AdminChallengeController;
use App\Http\Controllers\Api\V1\Admin\ChallengeFileController as AdminChallengeFileController;
use App\Http\Controllers\Api\V1\Admin\FlagController as AdminFlagController;
use App\Http\Controllers\Api\V1\Admin\HintController as AdminHintController;
use App\Http\Controllers\Api\V1\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Api\V1\Admin\ModuleController as AdminModuleController;
use App\Http\Controllers\Api\V1\Admin\PathController as AdminPathController;
use App\Http\Controllers\Api\V1\Admin\QuizController as AdminQuizController;
use App\Http\Controllers\Api\V1\Admin\TagController as AdminTagController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\ChallengeFileController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\HintUnlockController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\LessonController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\ModuleController;
use App\Http\Controllers\Api\V1\PathController;
use App\Http\Controllers\Api\V1\PathProgressController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SecurityController;
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
    // Health probes (docs/architecture.md آ§7). Liveness is cheap; readiness
    // probes the database, the cache and the challenge-artifact disk.
    Route::get('/health', [HealthController::class, 'show']);
    Route::get('/health/live', [HealthController::class, 'live']);
    Route::get('/health/ready', [HealthController::class, 'ready']);

    // Auth, challenges, paths, leaderboard, admin â€¦ land here as the
    // corresponding controllers/actions are implemented.

    Route::middleware('throttle:register')->group(function (): void {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    });

    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');

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
        Route::get('/auth/sessions', [SecurityController::class, 'sessions']);
        Route::delete('/auth/sessions/{tokenId}', [SecurityController::class, 'revokeSession'])
            ->whereNumber('tokenId');
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

    /*
    |--------------------------------------------------------------------------
    | Admin authoring (docs/api.md آ§5, Phase 5 backend)
    |--------------------------------------------------------------------------
    |
    | Authorization choice (documented per plan): no per-object policies
    | here â€” admin operates cross-ownership, so the `role` middleware is
    | the authorization layer. Moderators manage content; the nested
    | `role:admin` group reserves accounts (users/roles) and the audit
    | trail for administrators. Every mutation audits via AuditLogger.
    |
    | Transition endpoints map literally to statuses: publishâ†’published,
    | unpublishâ†’draft, archiveâ†’archived, reviewâ†’review. Illegal moves
    | are 409. DELETE on challenges/paths archives instead of deleting.
    */
    Route::prefix('admin')->middleware(['auth:sanctum', 'banned', 'role:admin,moderator', 'throttle:admin'])->group(function (): void {
        Route::get('/challenges', [AdminChallengeController::class, 'index']);
        Route::post('/challenges', [AdminChallengeController::class, 'store']);
        Route::get('/challenges/{challenge}', [AdminChallengeController::class, 'show']);
        Route::match(['put', 'patch'], '/challenges/{challenge}', [AdminChallengeController::class, 'update']);
        Route::delete('/challenges/{challenge}', [AdminChallengeController::class, 'destroy']);
        Route::post('/challenges/{challenge}/publish', [AdminChallengeController::class, 'publish']);
        Route::post('/challenges/{challenge}/unpublish', [AdminChallengeController::class, 'unpublish']);
        Route::post('/challenges/{challenge}/archive', [AdminChallengeController::class, 'archive']);
        Route::post('/challenges/{challenge}/review', [AdminChallengeController::class, 'review']);

        Route::get('/challenges/{challenge}/flags', [AdminFlagController::class, 'index']);
        Route::post('/challenges/{challenge}/flags', [AdminFlagController::class, 'store']);
        Route::get('/challenges/{challenge}/flags/{flag}', [AdminFlagController::class, 'show']);
        Route::match(['put', 'patch'], '/challenges/{challenge}/flags/{flag}', [AdminFlagController::class, 'update']);
        Route::delete('/challenges/{challenge}/flags/{flag}', [AdminFlagController::class, 'destroy']);

        Route::get('/challenges/{challenge}/hints', [AdminHintController::class, 'index']);
        Route::post('/challenges/{challenge}/hints', [AdminHintController::class, 'store']);
        Route::get('/challenges/{challenge}/hints/{hint}', [AdminHintController::class, 'show']);
        Route::match(['put', 'patch'], '/challenges/{challenge}/hints/{hint}', [AdminHintController::class, 'update']);
        Route::delete('/challenges/{challenge}/hints/{hint}', [AdminHintController::class, 'destroy']);

        Route::get('/challenges/{challenge}/files', [AdminChallengeFileController::class, 'index']);
        Route::post('/challenges/{challenge}/files', [AdminChallengeFileController::class, 'store']);
        Route::get('/challenges/{challenge}/files/{file}', [AdminChallengeFileController::class, 'show']);
        Route::put('/challenges/{challenge}/files/{file}', [AdminChallengeFileController::class, 'replace']);
        Route::delete('/challenges/{challenge}/files/{file}', [AdminChallengeFileController::class, 'destroy']);

        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::get('/categories/{category}', [AdminCategoryController::class, 'show']);
        Route::match(['put', 'patch'], '/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

        Route::get('/tags', [AdminTagController::class, 'index']);
        Route::post('/tags', [AdminTagController::class, 'store']);
        Route::get('/tags/{tag}', [AdminTagController::class, 'show']);
        Route::match(['put', 'patch'], '/tags/{tag}', [AdminTagController::class, 'update']);
        Route::delete('/tags/{tag}', [AdminTagController::class, 'destroy']);

        Route::get('/paths', [AdminPathController::class, 'index']);
        Route::post('/paths', [AdminPathController::class, 'store']);
        Route::get('/paths/{path}', [AdminPathController::class, 'show']);
        Route::match(['put', 'patch'], '/paths/{path}', [AdminPathController::class, 'update']);
        Route::delete('/paths/{path}', [AdminPathController::class, 'destroy']);
        Route::post('/paths/{path}/publish', [AdminPathController::class, 'publish']);
        Route::post('/paths/{path}/unpublish', [AdminPathController::class, 'unpublish']);
        Route::post('/paths/{path}/archive', [AdminPathController::class, 'archive']);
        Route::post('/paths/{path}/review', [AdminPathController::class, 'review']);

        Route::get('/paths/{path}/modules', [AdminModuleController::class, 'index']);
        Route::post('/paths/{path}/modules', [AdminModuleController::class, 'store']);
        Route::get('/modules/{module}', [AdminModuleController::class, 'show']);
        Route::match(['put', 'patch'], '/modules/{module}', [AdminModuleController::class, 'update']);
        Route::delete('/modules/{module}', [AdminModuleController::class, 'destroy']);

        Route::get('/modules/{module}/lessons', [AdminLessonController::class, 'index']);
        Route::post('/modules/{module}/lessons', [AdminLessonController::class, 'store']);
        Route::get('/lessons/{lesson}', [AdminLessonController::class, 'show']);
        Route::match(['put', 'patch'], '/lessons/{lesson}', [AdminLessonController::class, 'update']);
        Route::delete('/lessons/{lesson}', [AdminLessonController::class, 'destroy']);

        Route::get('/lessons/{lesson}/challenges', [AdminLessonController::class, 'linkedChallenges']);
        Route::post('/lessons/{lesson}/challenges', [AdminLessonController::class, 'linkChallenge']);
        Route::delete('/lessons/{lesson}/challenges/{challenge}', [AdminLessonController::class, 'unlinkChallenge']);

        Route::post('/modules/{module}/quizzes', [AdminQuizController::class, 'storeForModule']);
        Route::post('/lessons/{lesson}/quizzes', [AdminQuizController::class, 'storeForLesson']);
        Route::get('/quizzes/{quiz}', [AdminQuizController::class, 'show']);
        Route::match(['put', 'patch'], '/quizzes/{quiz}', [AdminQuizController::class, 'update']);
        Route::delete('/quizzes/{quiz}', [AdminQuizController::class, 'destroy']);

        Route::get('/quizzes/{quiz}/questions', [AdminQuizController::class, 'questionIndex']);
        Route::post('/quizzes/{quiz}/questions', [AdminQuizController::class, 'questionStore']);
        Route::get('/questions/{question}', [AdminQuizController::class, 'questionShow']);
        Route::match(['put', 'patch'], '/quizzes/{quiz}/questions/{question}', [AdminQuizController::class, 'questionUpdate']);
        Route::delete('/quizzes/{quiz}/questions/{question}', [AdminQuizController::class, 'questionDestroy']);

        Route::get('/questions/{question}/options', [AdminQuizController::class, 'optionIndex']);
        Route::post('/questions/{question}/options', [AdminQuizController::class, 'optionStore']);
        Route::match(['put', 'patch'], '/questions/{question}/options/{option}', [AdminQuizController::class, 'optionUpdate']);
        Route::delete('/questions/{question}/options/{option}', [AdminQuizController::class, 'optionDestroy']);

        Route::middleware('role:admin')->group(function (): void {
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::post('/users/{user}/ban', [AdminUserController::class, 'ban']);
            Route::post('/users/{user}/unban', [AdminUserController::class, 'unban']);
            Route::post('/users/{user}/unlock', [AdminUserController::class, 'unlock']);
            Route::match(['put', 'patch'], '/users/{user}/role', [AdminUserController::class, 'changeRole']);
            Route::post('/users/{user}/xp', [AdminUserController::class, 'adjustXp']);

            Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);
        });
    });
});
