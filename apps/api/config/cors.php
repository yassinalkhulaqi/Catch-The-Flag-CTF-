<?php

/*
|--------------------------------------------------------------------------
| CORS (docs/security.md §4)
|--------------------------------------------------------------------------
|
| Explicit allowlist only. allowed_origins is exactly the FRONTEND_URL
| origin(s) — comma-separated supported for staging/preview slots.
| Never a wildcard '*', and never credentials on a wildcard: the browser
| only talks to the Next.js BFF, which proxies server-side with a Bearer
| token, so supports_credentials stays false.
|
*/

$frontend = (string) env('FRONTEND_URL', 'http://localhost:3000');

$origins = array_values(array_filter(
    array_map(
        static fn (string $origin): string => trim($origin),
        explode(',', $frontend)
    ),
    // Drop empties and any wildcard — fail closed, never allow '*'.
    static fn (string $origin): bool => $origin !== '' && $origin !== '*',
));

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $origins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

    'exposed_headers' => ['Retry-After'],

    'max_age' => 0,

    'supports_credentials' => false,
];
