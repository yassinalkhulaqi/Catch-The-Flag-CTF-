<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'bio'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * In-memory defaults mirroring the database defaults (migrations only
     * apply on the DB side; a freshly-created instance needs these too).
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'user',
        'xp' => 0,
        'solved_count' => 0,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
            'banned_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /** @return HasMany<ChallengeSubmission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(ChallengeSubmission::class);
    }

    /** @return HasMany<Bookmark, $this> */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    /** @return HasMany<ChallengeSolve, $this> */
    public function solves(): HasMany
    {
        return $this->hasMany(ChallengeSolve::class);
    }

    /** @return HasMany<UserPathProgress, $this> */
    public function pathProgress(): HasMany
    {
        return $this->hasMany(UserPathProgress::class);
    }

    /** @return HasMany<LessonCompletion, $this> */
    public function lessonCompletions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    /** @return HasMany<XpTransaction, $this> */
    public function xpTransactions(): HasMany
    {
        return $this->hasMany(XpTransaction::class);
    }

    /** @return HasMany<UserAchievement, $this> */
    public function achievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }

    /**
     * Role check with hierarchy: admin satisfies moderator and user
     * requirements, moderator satisfies user.
     */
    public function hasRole(Role|string ...$roles): bool
    {
        $current = $this->role instanceof Role
            ? $this->role
            : Role::tryFrom(strtolower((string) $this->role));

        if ($current === null) {
            return false;
        }

        foreach ($roles as $role) {
            $role = $role instanceof Role ? $role : Role::from($role);
            if ($current->isAtLeast($role)) {
                return true;
            }
        }

        return false;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::Admin);
    }

    public function isBanned(): bool
    {
        return $this->banned_at !== null;
    }
}
