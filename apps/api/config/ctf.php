<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rate limits (docs/security.md §4)
    |--------------------------------------------------------------------------
    */

    'rate_limits' => [
        'auth_per_minute' => (int) env('RATE_LIMIT_AUTH_PER_MIN', 5),
        'submit_per_challenge_per_minute' => (int) env('RATE_LIMIT_SUBMIT_PER_CHALLENGE_PER_MIN', 10),
        'submit_per_user_per_minute' => (int) env('RATE_LIMIT_SUBMIT_PER_USER_PER_MIN', 30),
        'download_per_minute' => (int) env('RATE_LIMIT_DOWNLOAD_PER_MIN', 60),
        'admin_per_minute' => (int) env('RATE_LIMIT_ADMIN_PER_MIN', 120),
        'api_per_minute' => (int) env('RATE_LIMIT_API_PER_MIN', 300),
    ],

    /*
    |--------------------------------------------------------------------------
    | Uploads (docs/security.md §6)
    |--------------------------------------------------------------------------
    */

    'uploads' => [
        'max_file_mb' => (int) env('MAX_CHALLENGE_FILE_MB', 64),
        'allowed_mime_types' => [
            // logs / text / configs
            'text/plain', 'text/csv', 'text/xml', 'application/json',
            'application/xml', 'application/octet-stream',
            // archives (never extracted server-side)
            'application/zip', 'application/gzip', 'application/x-tar',
            'application/x-7z-compressed', 'application/x-rar-compressed',
            // forensics / analysis artifacts
            'application/vnd.tcpdump.pcap', 'application/x-pcapng',
            'application/pdf', 'image/png', 'image/jpeg', 'image/gif',
            'image/bmp', 'image/webp', 'application/x-msdownload',
            'application/x-executable', 'application/x-sharedlib',
            'application/x-dosexec', 'text/html',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | XP & progression rules (docs/database.md §7–8)
    |--------------------------------------------------------------------------
    */

    'xp' => [
        'quiz_pass' => (int) env('XP_QUIZ_PASS', 25),
        'lesson_complete' => (int) env('XP_LESSON_COMPLETE', 10),
        'path_complete' => (int) env('XP_PATH_COMPLETE', 200),
        'achievement' => (int) env('XP_ACHIEVEMENT', 50),
    ],

    'quiz' => [
        'default_pass_score' => 70,
    ],

    'tokens' => [
        'ttl_days' => (int) env('TOKEN_TTL_DAYS', 30),
    ],

    'leaderboard' => [
        'page_size' => 20,
        'max_page_size' => 100,
    ],

    'search' => [
        'min_query_length' => 2,
        'default_page_size' => 20,
    ],

    'submissions' => [
        // days submission IPs are retained for abuse analysis (docs/security.md §8)
        'ip_retention_days' => 90,
    ],
];
