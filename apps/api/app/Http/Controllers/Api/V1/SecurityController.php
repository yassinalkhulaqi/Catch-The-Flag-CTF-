<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Session management (docs/security.md §2).
 *
 * Laravel issues one personal access token per browser session. This lists
 * them (never the token hash) and revokes any one of them — including the
 * current one, which is equivalent to a logout for that browser.
 */
class SecurityController extends Controller
{
    /**
     * List the current user's active sessions.
     */
    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();

        $currentId = $user->currentAccessToken()?->id;

        $sessions = $user->tokens()
            ->latest('created_at')
            ->limit(100)
            ->get()
            ->map(static fn ($token): array => [
                'id' => $token->id,
                'name' => $token->name,
                'created_at' => $token->created_at?->toISOString(),
                'last_used_at' => $token->last_used_at?->toISOString(),
                'expires_at' => $token->expires_at?->toISOString(),
                'current' => $token->id === $currentId,
            ])
            ->values();

        return response()->json(['data' => [
            'current_id' => $currentId,
            'sessions' => $sessions,
        ]]);
    }

    /**
     * Revoke one of the current user's sessions.
     */
    public function revokeSession(Request $request, int $tokenId): JsonResponse
    {
        $token = $request->user()->tokens()->where('id', $tokenId)->first();

        if ($token === null) {
            throw new NotFoundHttpException;
        }

        $token->delete();

        return response()->json(['data' => ['revoked' => true]]);
    }
}
