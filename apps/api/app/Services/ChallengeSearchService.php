<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ContentStatus;
use App\Enums\Role;
use App\Models\Challenge;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Read-only challenge listing (docs/api.md §1.2, §3). PostgreSQL
 * tsvector full-text on `q`, explicit allowlisted filters, guests
 * forced to published. Deterministic ordering always ends in id ASC.
 */
class ChallengeSearchService
{
    /**
     * @param  array<string, mixed>  $filters  Validated query params.
     */
    public function search(array $filters, ?User $user): LengthAwarePaginator
    {
        $isStaff = $user !== null && $user->hasRole(Role::Moderator);

        $query = Challenge::query()->with(['category', 'tags', 'author']);

        $this->applyStatus($query, $filters, $isStaff);
        $this->applyTextSearch($query, $filters);
        $this->applyCategory($query, $filters);
        $this->applyDifficulty($query, $filters);
        $this->applyTags($query, $filters);
        $this->applyPoints($query, $filters);
        $this->applySolved($query, $filters, $user);
        $this->applySorting($query, $filters);
        $this->constrainSolvesForViewer($query, $user);

        $perPage = $this->perPage($filters);
        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyStatus(Builder $query, array $filters, bool $isStaff): void
    {
        $status = ContentStatus::Published->value;

        if ($isStaff && is_string($filters['status'] ?? null)) {
            $candidate = strtolower(trim($filters['status']));
            $allowed = array_map(static fn (ContentStatus $case): string => $case->value, ContentStatus::cases());
            if (in_array($candidate, $allowed, true)) {
                $status = $candidate;
            }
        }

        $query->where('status', $status);
    }

    /**
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyTextSearch(Builder $query, array $filters): void
    {
        $term = trim((string) ($filters['q'] ?? ''));

        if ($term === '' || mb_strlen($term) < (int) config('ctf.search.min_query_length', 2)) {
            return;
        }

        $query->whereRaw("challenges.search_vector @@ plainto_tsquery('simple', ?)", [$term]);
    }

    /**
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyCategory(Builder $query, array $filters): void
    {
        $slug = trim((string) ($filters['category'] ?? ''));

        if ($slug === '') {
            return;
        }

        $query->whereHas('category', function (Builder $related) use ($slug): void {
            $related->where('slug', $slug);
        });
    }

    /**
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyDifficulty(Builder $query, array $filters): void
    {
        $difficulty = trim((string) ($filters['difficulty'] ?? ''));

        if ($difficulty === '') {
            return;
        }

        $query->where('difficulty', $difficulty);
    }

    /**
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyTags(Builder $query, array $filters): void
    {
        $tags = $filters['tags'] ?? [];

        if (is_string($tags)) {
            $tags = array_values(array_filter(array_map(trim(...), explode(',', $tags))));
        }

        if (! is_array($tags) || $tags === []) {
            return;
        }

        $slugs = array_values(array_unique(array_map(strval(...), $tags)));

        $query->whereHas('tags', function (Builder $related) use ($slugs): void {
            $related->whereIn('slug', $slugs);
        });
    }

    /**
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyPoints(Builder $query, array $filters): void
    {
        if (isset($filters['min_points']) && $filters['min_points'] !== null && $filters['min_points'] !== '') {
            $query->where('points', '>=', (int) $filters['min_points']);
        }

        if (isset($filters['max_points']) && $filters['max_points'] !== null && $filters['max_points'] !== '') {
            $query->where('points', '<=', (int) $filters['max_points']);
        }
    }

    /**
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applySolved(Builder $query, array $filters, ?User $user): void
    {
        if ($user === null || ! array_key_exists('solved', $filters) || $filters['solved'] === null || $filters['solved'] === '') {
            return;
        }

        $solved = filter_var($filters['solved'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($solved === null) {
            return;
        }

        if ($solved) {
            $query->whereExists(function ($exists) use ($user): void {
                $exists->selectRaw('1')->from('challenge_solves')
                    ->whereColumn('challenge_solves.challenge_id', 'challenges.id')
                    ->where('challenge_solves.user_id', $user->id);
            });
        } else {
            $query->whereNotExists(function ($exists) use ($user): void {
                $exists->selectRaw('1')->from('challenge_solves')
                    ->whereColumn('challenge_solves.challenge_id', 'challenges.id')
                    ->where('challenge_solves.user_id', $user->id);
            });
        }
    }

    /**
     * Sort allowlist (docs/api.md §1.2): leading `-` = descending.
     * A trailing id ASC tiebreak keeps every page deterministic.
     *
     * @param  Builder<Challenge>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applySorting(Builder $query, array $filters): void
    {
        $sort = trim((string) ($filters['sort'] ?? '-created_at'));

        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $field = ltrim($sort, '-');

        $column = match ($field) {
            'points' => 'points',
            'title' => 'title',
            'solve_count' => 'solve_count',
            default => 'created_at',
        };

        $query->orderBy($column, $direction)->orderBy('id', 'asc');
    }

    /**
     * Pre-load only the viewer's own solve rows so resources can render
     * the `solved` flag without N+1 exists queries.
     *
     * @param  Builder<Challenge>  $query
     */
    private function constrainSolvesForViewer(Builder $query, ?User $user): void
    {
        $query->with(['solves' => function ($related) use ($user): void {
            $related->where('user_id', $user?->id);
        }]);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function perPage(array $filters): int
    {
        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : (int) config('ctf.search.default_page_size', 20);

        return min(max($perPage, 1), 100);
    }
}
