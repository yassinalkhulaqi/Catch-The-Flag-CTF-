<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContentStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\PathIndexRequest;
use App\Http\Resources\PathDetailResource;
use App\Http\Resources\PathSummaryResource;
use App\Models\Path;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Public learning-path catalog (docs/api.md §3). Accepts id OR slug
 * on detail. Guests are forced to published; staff may filter by
 * status. Invisible records are 404, never 403.
 */
class PathController extends Controller
{
    public function index(PathIndexRequest $request): mixed
    {
        Gate::authorize('viewAny', Path::class);

        $viewer = $request->user('sanctum');
        $isStaff = $viewer !== null && $viewer->hasRole(Role::Moderator);

        $query = Path::query()->with(['category']);

        $this->applyStatus($query, $request->validated(), $isStaff);
        $this->applyFilters($query, $request->validated(), $viewer?->id);
        $this->applySorting($query, (string) ($request->validated()['sort'] ?? '-created_at'));

        $perPage = min(max((int) ($request->validated()['per_page'] ?? 20), 1), 100);
        $page = max(1, (int) ($request->validated()['page'] ?? 1));

        return PathSummaryResource::collection($query->paginate($perPage, ['*'], 'page', $page));
    }

    public function show(Request $request, string $path): PathDetailResource
    {
        $model = $this->resolve($path);

        if ($model === null || Gate::denies('view', $model)) {
            abort(404);
        }

        $viewer = $request->user('sanctum');
        $isStaff = $viewer !== null && $viewer->hasRole(Role::Moderator);

        $model->load([
            'category',
            'prerequisites' => fn ($prerequisites) => $prerequisites
                ->when(! $isStaff, fn ($q) => $q->published())
                ->with('category'),
            'modules' => fn ($modules) => $modules
                ->when(! $isStaff, fn ($q) => $q->where('is_published', true))
                ->orderBy('position')->orderBy('id'),
            'modules.lessons' => fn ($lessons) => $lessons
                ->when(! $isStaff, fn ($q) => $q->where('is_published', true))
                ->orderBy('position')->orderBy('id'),
        ]);

        return new PathDetailResource($model);
    }

    /**
     * @param  Builder<Path>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyStatus(Builder $query, array $filters, bool $isStaff): void
    {
        if ($isStaff && is_string($filters['status'] ?? null)) {
            $query->where('status', strtolower(trim($filters['status'])));
        } else {
            $query->where('status', ContentStatus::Published->value);
        }
    }

    /**
     * @param  Builder<Path>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters, ?int $viewerId): void
    {
        if (trim((string) ($filters['q'] ?? '')) !== '' && mb_strlen(trim((string) $filters['q'])) >= (int) config('ctf.search.min_query_length', 2)) {
            $query->whereRaw("paths.search_vector @@ plainto_tsquery('simple', ?)", [trim((string) $filters['q'])]);
        }

        if (trim((string) ($filters['category'] ?? '')) !== '') {
            $slug = trim((string) $filters['category']);
            $query->whereHas('category', fn (Builder $related) => $related->where('slug', $slug));
        }

        if (trim((string) ($filters['difficulty'] ?? '')) !== '') {
            $query->where('difficulty', trim((string) $filters['difficulty']));
        }

        $progress = $filters['progress'] ?? null;

        if ($viewerId !== null && is_string($progress) && $progress !== '') {
            match ($progress) {
                'completed' => $query->whereHas('progress', fn (Builder $related) => $related->where('user_id', $viewerId)->where('status', 'completed')),
                'in_progress' => $query->whereHas('progress', fn (Builder $related) => $related->where('user_id', $viewerId)->where('status', 'in_progress')),
                'not_started' => $query->whereNotExists(function ($exists) use ($viewerId): void {
                    $exists->selectRaw('1')->from('user_path_progress')
                        ->whereColumn('user_path_progress.path_id', 'paths.id')
                        ->where('user_path_progress.user_id', $viewerId);
                }),
                default => null,
            };
        }
    }

    /**
     * @param  Builder<Path>  $query
     */
    private function applySorting(Builder $query, string $sort): void
    {
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $field = ltrim($sort, '-');

        $column = match ($field) {
            'title' => 'title',
            'estimated_minutes' => 'estimated_minutes',
            default => 'created_at',
        };

        $query->orderBy($column, $direction)->orderBy('id', 'asc');
    }

    private function resolve(string $key): ?Path
    {
        $query = Path::query();

        if (ctype_digit($key)) {
            $query->where('id', (int) $key)->orWhere('slug', $key);
        } else {
            $query->where('slug', $key);
        }

        return $query->first();
    }
}
