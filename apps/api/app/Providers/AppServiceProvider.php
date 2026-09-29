<?php

declare(strict_types=1);

namespace App\Providers;

use App\Enums\FlagValidationType;
use App\Enums\Role;
use App\Models\Achievement;
use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\ChallengeHint;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Tag;
use App\Models\User;
use App\Policies\AchievementPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\ChallengeFilePolicy;
use App\Policies\ChallengeHintPolicy;
use App\Policies\ChallengePolicy;
use App\Policies\LessonPolicy;
use App\Policies\ModulePolicy;
use App\Policies\PathPolicy;
use App\Policies\QuizAttemptPolicy;
use App\Policies\QuizPolicy;
use App\Policies\TagPolicy;
use App\Policies\UserPolicy;
use App\Services\FlagValidators\FlagValidatorRegistry;
use App\Services\FlagValidators\StaticFlagValidator;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FlagValidatorRegistry::class, function ($app): FlagValidatorRegistry {
            $registry = new FlagValidatorRegistry;
            $registry->register(FlagValidationType::Static, $app->make(StaticFlagValidator::class));

            return $registry;
        });
    }

    public function boot(): void
    {
        Gate::policy(Path::class, PathPolicy::class);
        Gate::policy(Lesson::class, LessonPolicy::class);
        Gate::policy(PathModule::class, ModulePolicy::class);
        Gate::policy(Challenge::class, ChallengePolicy::class);
        Gate::policy(ChallengeFile::class, ChallengeFilePolicy::class);
        Gate::policy(ChallengeHint::class, ChallengeHintPolicy::class);
        Gate::policy(Quiz::class, QuizPolicy::class);
        Gate::policy(QuizAttempt::class, QuizAttemptPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Achievement::class, AchievementPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);

        Gate::define('viewAdminDashboard', fn (User $user): bool => $user->isAtLeast(Role::Moderator));
        Gate::define('viewAuditLogs', fn (User $user): bool => $user->isAtLeast(Role::Moderator));

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute((int) config('ctf.rate_limits.api_per_minute', 300))
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute((int) config('ctf.rate_limits.auth_per_minute', 5))
                ->by($request->ip());
        });

        // docs/api.md + security.md: 3 registrations / hour / IP
        RateLimiter::for('register', function (Request $request) {
            return Limit::perHour((int) config('ctf.rate_limits.register_per_hour', 3))
                ->by($request->ip());
        });

        RateLimiter::for('submit-user', function (Request $request) {
            return Limit::perMinute((int) config('ctf.rate_limits.submit_per_user_per_minute', 30))
                ->by((string) $request->user()?->id);
        });

        RateLimiter::for('submit-challenge', function (Request $request) {
            $challenge = $request->route('challenge');
            $challengeId = is_object($challenge) ? (string) $challenge->getKey() : (string) $challenge;

            return Limit::perMinute((int) config('ctf.rate_limits.submit_per_challenge_per_minute', 10))
                ->by(($request->user()?->id ?? 'guest').'|'.$challengeId);
        });
    }
}
