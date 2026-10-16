<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Strict mode
    |--------------------------------------------------------------------------
    |
    | When true, N+1 query detection throws an exception, failing tests that
    | trigger N+1 queries. Enabled in the test environment via APP_ENV=testing.
    */

    'strict' => app()->environment('testing'),

    /*
    |--------------------------------------------------------------------------
    | Ignore routes
    |--------------------------------------------------------------------------
    */

    'ignore' => [
        //
    ],

];
