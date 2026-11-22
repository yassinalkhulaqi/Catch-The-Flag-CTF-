<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Learner bookmarks with optional private notes (docs/product.md §6).
 *
 * A bookmark is an upsert, not a create: POSTing the same target twice
 * replaces the note. Targets follow the morph map (`challenge` | `lesson` |
 * `path`). Drafts are invisible to non-staff; invisible targets answer 404,
 * never 403, so existence is not revealed.
 */
class BookmarkController extends Controller
{
    /**
     * @var array<string, class-string<Model>>
     */
    private const TARGETS = [
        'challenge' => Challenge::class,
        'lesson' => Lesson::class,
        'path' => Path::class,
    ];

    /**
     * List the current user's bookmarks.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $bookmarks = $user->bookmarks()
            ->with('bookmarkable')
            ->latest('id')
            ->limit(200)
            ->get()
            ->map(fn (Bookmark $bookmark) => $this->resource($bookmark))
            ->values();

        return response()->json(['data' => $bookmarks]);
    }

    /**
     * Add or retarget a bookmark (idempotent — POST is an upsert).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:challenge,lesson,path'],
            'id' => ['required', 'integer', 'min:1'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        $target = $this->visibleTarget($user, $validated['type'], (int) $validated['id']);

        if ($target === null) {
            throw new NotFoundHttpException;
        }

        $bookmark = $user->bookmarks()->firstOrNew([
            'bookmarkable_type' => $validated['type'],
            'bookmarkable_id' => $target->id,
        ]);

        if (array_key_exists('note', $validated)) {
            $bookmark->note = $validated['note'];
        }

        $bookmark->save();

        return response()->json(['data' => $this->resource($bookmark->load('bookmarkable'))], 201);
    }

    /**
     * Replace the note on one of the current user's bookmarks.
     */
    public function update(Request $request, Bookmark $bookmark): JsonResponse
    {
        Gate::authorize('update', $bookmark);

        $validated = $request->validate([
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $bookmark->note = $validated['note'] ?? null;
        $bookmark->save();

        return response()->json(['data' => $this->resource($bookmark->load('bookmarkable'))]);
    }

    /**
     * Remove one of the current user's bookmarks.
     */
    public function destroy(Request $request, Bookmark $bookmark): JsonResponse
    {
        Gate::authorize('delete', $bookmark);

        $bookmark->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * Resolve the target and check learner visibility. Staff may bookmark
     * drafts; learners must not learn that drafts exist.
     */
    private function visibleTarget(User $user, string $type, int $id): ?Model
    {
        return match ($type) {
            'challenge' => $this->visible($user, Challenge::find($id), 'view'),
            'lesson' => $this->visible($user, Lesson::find($id), 'view'),
            'path' => $this->visible($user, Path::find($id), 'view'),
            default => null,
        };
    }

    private function visible(User $user, ?Model $model, string $ability): ?Model
    {
        if ($model === null) {
            return null;
        }

        return Gate::forUser($user)->allows($ability, $model) ? $model : null;
    }

    /**
     * Shape one bookmark for the client.
     *
     * @return array<string, mixed>
     */
    private function resource(Bookmark $bookmark): array
    {
        $target = $bookmark->relationLoaded('bookmarkable') ? $bookmark->bookmarkable : $bookmark->bookmarkable()->first();

        return [
            'id' => $bookmark->id,
            'type' => $this->morphAliasFor($target),
            'note' => $bookmark->note,
            'created_at' => $bookmark->created_at?->toISOString(),
            'target' => $this->targetMeta($target),
        ];
    }

    private function targetMeta(?Model $target): ?array
    {
        if ($target === null) {
            return null;
        }

        return match (true) {
            $target instanceof Challenge => [
                'id' => $target->id,
                'slug' => $target->slug,
                'title' => $target->title,
                'difficulty' => $target->difficulty?->value ?? (string) $target->difficulty,
                'points' => $target->points,
            ],
            $target instanceof Lesson => [
                'id' => $target->id,
                'title' => $target->title,
                'estimated_minutes' => (int) $target->estimated_minutes,
            ],
            $target instanceof Path => [
                'id' => $target->id,
                'slug' => $target->slug,
                'title' => $target->title,
                'difficulty' => $target->difficulty?->value ?? (string) $target->difficulty,
            ],
            default => null,
        };
    }

    private function morphAliasFor(?Model $target): string
    {
        return match (true) {
            $target instanceof Challenge => 'challenge',
            $target instanceof Lesson => 'lesson',
            $target instanceof Path => 'path',
            default => 'lesson',
        };
    }
}
