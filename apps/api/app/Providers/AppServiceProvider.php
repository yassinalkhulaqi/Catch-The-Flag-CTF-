<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Category;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Policies\CategoryPolicy;
use App\Policies\ChallengePolicy;
use App\Policies\LessonPolicy;
use App\Policies\PathModulePolicy;
use App\Policies\PathPolicy;
use App\Policies\QuizAttemptPolicy;
use App\Policies\QuizPolicy;
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
        Gate::policy(PathModule::class, PathModulePolicy::class);
        Gate::policy(Lesson::class, LessonPolicy::class);
        Gate::policy(Quiz::class, QuizPolicy::class);
        Gate::policy(QuizAttempt::class, QuizAttemptPolicy::class);
    }

    /**
     * Named rate limiters driven by config/ctf.php (docs/security.md §4).
     * All resolve per-minute (per-hour for register/password-reset);
     * authenticated limiters key on user id so one abuser cannot exhaust a
     * shared bucket.
     *
     * Config is read at request time rather than at boot time, so an
     * environment change takes effect without a process restart.
     */
    protected function defineRateLimiters(): void
    {
        RateLimiter::for('login', static fn (Request $request): Limit => Limit::perMinute(
            self::rateLimit('auth_per_minute', 5),
        )->by($request->ip()));

        RateLimiter::for('register', static fn (Request $request): Limit => Limit::perHour(
            self::rateLimit('register_per_hour', 3),
        )->by($request->ip()));

        // Password reset is the weak point of any auth surface: it must not
        // be usable to enumerate accounts or to bomb someone's inbox.
        RateLimiter::for('password-reset', static fn (Request $request): Limit => Limit::perHour(
            self::rateLimit('password_reset_per_hour', 5),
        )->by($request->ip()));

        RateLimiter::for('submission-challenge', static fn (Request $request): Limit => Limit::perMinute(
            self::rateLimit('submit_per_challenge_per_minute', 10),
        )->by(
            $request->user()?->getAuthIdentifier().'|'.$request->route('challenge')
        ));

        RateLimiter::for('submission-user', static fn (Request $request): Limit => Limit::perMinute(
            self::rateLimit('submit_per_user_per_minute', 30),
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));

        RateLimiter::for('download', static fn (Request $request): Limit => Limit::perMinute(
            self::rateLimit('download_per_minute', 60),
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));

        RateLimiter::for('admin', static fn (Request $request): Limit => Limit::perMinute(
            self::rateLimit('admin_per_minute', 120),
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));

        RateLimiter::for('api', static fn (Request $request): Limit => Limit::perMinute(
            self::rateLimit('api_per_minute', 300),
        )->by(
            $request->user()?->getAuthIdentifier() ?? $request->ip()
        ));
    }

    /**
     * One rate limit from config/ctf.php, with a fallback so a missing key
     * never turns into an unlimited bucket.
     */
    private static function rateLimit(string $key, int $fallback): int
    {
        return (int) config("ctf.rate_limits.{$key}", $fallback);
    }
}
