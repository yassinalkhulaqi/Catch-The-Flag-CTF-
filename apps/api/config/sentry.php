<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Sentry DSN
    |--------------------------------------------------------------------------
    |
    | When set, errors and exceptions are sent to Sentry. PII scrubbing is
    | enabled by default via `send_default_pii => false`.
    |
    */

    'dsn' => env('SENTRY_LARAVEL_DSN'),

    /*
    |--------------------------------------------------------------------------
    | Client-side (browser) DSN
    |--------------------------------------------------------------------------
    |
    | Exposed to frontend blades/views for browser error tracking.
    */

    'client_dsn' => null,

    /*
    |--------------------------------------------------------------------------
    | Environment
    |--------------------------------------------------------------------------
    */

    'environment' => env('APP_ENV'),

    /*
    |--------------------------------------------------------------------------
    | Release (tagged from git SHA at deploy time)
    |--------------------------------------------------------------------------
    */

    'release' => env('SENTRY_RELEASE'),

    /*
    |--------------------------------------------------------------------------
    | Traces sample rate (performance monitoring)
    |--------------------------------------------------------------------------
    */

    'traces_sample_rate' => env('SENTRY_LARAVEL_TRACES_SAMPLE_RATE', 0.1),

    /*
    |--------------------------------------------------------------------------
    | Send default PII (disabled — never send passwords/flags/tokens)
    |--------------------------------------------------------------------------
    */

    'send_default_pii' => false,

    /*
    |--------------------------------------------------------------------------
    | Before send callback — scrub sensitive request data
    |--------------------------------------------------------------------------
    */

    'before_send' => function (\Sentry\Event $event, \Sentry\Breadcrumb $hint) {
        $request = $event->request;
        if ($request) {
            $request->headers = null;
            $request->cookies = null;
            $request->body = null;
            $request->query_string = null;
        }

        $contexts = $event->contexts;
        if (isset($contexts['trace'])) {
            $data = $contexts['trace']['data'] ?? [];
            unset($data['password'], $data['token'], $data['flag'], $data['secret']);
            $contexts['trace']['data'] = $data;
        }

        return $event;
    },

];
