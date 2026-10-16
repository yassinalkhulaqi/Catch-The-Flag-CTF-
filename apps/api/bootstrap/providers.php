<?php

use App\Providers\AppServiceProvider;

return array_filter([
    AppServiceProvider::class,
    app()->environment('testing')
        ? \NunoMaduro\LaravelQueryDetector\LaravelQueryDetectorServiceProvider::class
        : null,
]);
