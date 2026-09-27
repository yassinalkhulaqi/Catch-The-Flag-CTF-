<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        /*
        | Private challenge artifacts (pcaps, samples, logs…).
        | Local driver in development; any S3-compatible provider in production
        | (ADR-0009). NEVER publicly served — downloads go through the
        | authorized endpoint only (docs/security.md §6).
        */
        'challenge-files' => [
            'driver' => env('STORAGE_DRIVER', 'local') === 's3' ? 's3' : 'local',
            'root' => storage_path('app/challenge-files'),
            'serve' => false,
            'visibility' => 'private',
            'key' => env('STORAGE_AWS_KEY') ?: env('AWS_ACCESS_KEY_ID'),
            'secret' => env('STORAGE_AWS_SECRET') ?: env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('STORAGE_AWS_REGION') ?: env('AWS_DEFAULT_REGION', 'us-east-1'),
            'bucket' => env('STORAGE_AWS_BUCKET') ?: env('AWS_BUCKET'),
            'endpoint' => env('STORAGE_AWS_ENDPOINT') ?: env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => (bool) (env('STORAGE_AWS_USE_PATH_STYLE_ENDPOINT', false) ?: env('AWS_USE_PATH_STYLE_ENDPOINT', false)),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
