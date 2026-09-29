<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'bio',
        'avatar_path',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
            'xp' => 'integer',
            'solved_count' => 'integer',
            'banned_at' => 'datetime',
            'last_login_at' => 'datetime',
            'preferences' => 'array',
        ];
    }

    public function themePreference(): string
    {
        $theme = $this->preferences['theme'] ?? 'system';

        return in_array($theme, ['system', 'light', 'dark'], true) ? $theme : 'system';
    }

    public function hasRole(Role|string $role): bool
    {
        $expected = $role instanceof Role ? $role : Role::tryFrom($role);

        return $expected !== null && $this->role === $expected;
    }

    public function isAtLeast(Role $role): bool
    {
        return $this->role instanceof Role && $this->role->isAtLeast($role);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::Admin);
    }

    public function isModerator(): bool
    {
        return $this->isAtLeast(Role::Moderator);
    }

    public function isBanned(): bool
    {
        return $this->banned_at !== null;
    }

    public function scopeNotBanned(Builder $query): Builder
    {
        return $query->whereNull('banned_at');
    }

    public function scopeLeaderboardEligible(Builder $query): Builder
    {
        return $query->whereNull('deleted_at')->whereNull('banned_at');
    }

    public function solves(): HasMany
    {
        return $this->hasMany(ChallengeSolve::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ChallengeSubmission::class);
    }

    public function xpTransactions(): HasMany
    {
        return $this->hasMany(XpTransaction::class);
    }

    public function pathProgress(): HasMany
    {
        return $this->hasMany(UserPathProgress::class);
    }

    public function lessonCompletions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    public function achievements(): BelongsToMany
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot('awarded_at')
            ->withTimestamps(false);
    }

    public function userAchievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }

    public function hintUnlocks(): HasMany
    {
        return $this->hasMany(HintUnlock::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function avatarUrl(): ?string
    {
        if ($this->avatar_path === null) {
            return null;
        }

        return asset('storage/'.$this->avatar_path);
    }
}
