<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Category;
use App\Models\Challenge;
use App\Models\Path;
use App\Policies\CategoryPolicy;
use App\Policies\ChallengePolicy;
use App\Policies\PathPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->defineRateLimiters();
        $this->registerPolicies();

        // Password reset links point at the Next.js frontend, never the API:
        // the token travels in the URL once and is consumed server-side.
        ResetPassword::createUrlUsing(static function (object $user, string $token): string {
            $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');

            return "{$frontend}/reset-password?token={$token}&email=".urlencode($user->getEmailForPasswordReset());
        });
    }

    /**
     * Content visibility policies (Phase 2: public learning content).
     * Guests and learners see published/active records only;
     * moderators and admins see everything.
     */
    protected function registerPolicies(): void
    {
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Challenge::class, ChallengePolicy::class);
        Gate::policy(Path::class, PathPolicy::class);
    }

    /**
     * Named rate limiters driven by config/ctf.php (docs/security.md §4).
     * All resolve per-minute; authenticated limiters key on user id so one
     * abuser cannot exhaust a shared bucket.
     */
    protected function defineRateLimiters(): void
    {
        $limits = config('ctf.rate_limits');

        RateLimiter::for('login', static fn (Request $request): Limit => Limit::perMinute(
            $limits['auth_per_minute'],
        )->by($request->ip()));

        RateLimiter::for('register', static fn (Request $request): Limit => Limit::perHour(
            3,
        )->by($request->ip()));

        RateLimiter::for('submission-challenge', static fn (Request $request): Limit => Limit::perMinute(
            $limits['submit_per_challenge_per_minute'],
        )->by(
            $request->user()?->getAuthIdentifier().'|'.$request->route('challenge')
        ));

        RateLimiter::for('submission-user', static fn (Request $request): Limit => Limit::perMinute(
            $limits['submit_per_user_per_minute'],
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));

        RateLimiter::for('download', static fn (Request $request): Limit => Limit::perMinute(
            $limits['download_per_minute'],
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));

        RateLimiter::for('admin', static fn (Request $request): Limit => Limit::perMinute(
            $limits['admin_per_minute'],
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));

        RateLimiter::for('api', static fn (Request $request): Limit => Limit::perMinute(
            $limits['api_per_minute'],
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));
    }
}
