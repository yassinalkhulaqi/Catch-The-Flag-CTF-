<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled maintenance (docs/architecture.md §7 Observability)
|--------------------------------------------------------------------------
|
| Requires the Laravel scheduler to be running (cron calls `schedule:run`
| every minute, or `schedule:work`). Without it these are inert — the same
| commands can always be invoked manually by an operator.
|
*/
$scheduleRetention = (bool) env('CTF_SCHEDULE_RETENTION', true);

if ($scheduleRetention) {
    Schedule::command('ctf:prune-submissions')
        ->dailyAt('03:30')
        ->withoutOverlapping()
        ->onOneServer();

    Schedule::command('ctf:prune-tokens')
        ->dailyAt('03:45')
        ->withoutOverlapping()
        ->onOneServer();
}
