<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\Path;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Everything waiting on a reviewer (docs/content-authoring.md).
 *
 * `ContentStatus::Review` is the queue. Approving publishes; requesting
 * changes returns the item to draft — both through the existing transition
 * endpoints, so the audit trail stays uniform.
 *
 * Read-only: no writes, no secrets, just what the queue needs to
 * make a decision.
 */
class AdminReviewQueueController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAdminDashboard');

        $challenges = Challenge::where('status', ContentStatus::Review->value)
            ->with('author:id,name')
            ->orderBy('updated_at')
            ->limit(50)
            ->get(['id', 'title', 'slug', 'difficulty', 'points', 'author_id', 'updated_at'])
            ->map(fn (Challenge $challenge): array => [
                'id' => $challenge->id,
                'title' => $challenge->title,
                'slug' => $challenge->slug,
                'difficulty' => $challenge->difficulty?->value ?? (string) $challenge->difficulty,
                'points' => $challenge->points,
                'author' => $challenge->author?->name,
                'updated_at' => $challenge->updated_at?->toISOString(),
            ])
            ->values();

        $paths = Path::where('status', ContentStatus::Review->value)
            ->orderBy('updated_at')
            ->limit(50)
            ->get(['id', 'title', 'slug', 'difficulty', 'estimated_minutes', 'updated_at'])
            ->map(fn (Path $path): array => [
                'id' => $path->id,
                'title' => $path->title,
                'slug' => $path->slug,
                'difficulty' => $path->difficulty?->value ?? (string) $path->difficulty,
                'estimated_minutes' => $path->estimated_minutes,
                'updated_at' => $path->updated_at?->toISOString(),
            ])
            ->values();

        return response()->json(['data' => [
            'challenges' => $challenges,
            'paths' => $paths,
        ]]);
    }
}
