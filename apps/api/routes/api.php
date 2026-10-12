<?php

declare(strict_types=1);

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
});
