<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Defense-in-depth role gate for admin/moderator route groups.
 * Policies still authorize every object access.
 */
final class EnsureRole
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'error' => [
                    'code' => 'unauthenticated',
                    'message' => 'Unauthenticated.',
                ],
            ], 401);
        }

        if ($user->banned_at !== null) {
            return response()->json([
                'error' => [
                    'code' => 'account_banned',
                    'message' => 'This account has been suspended.',
                ],
            ], 403);
        }

        $allowed = collect($roles)
            ->map(fn (string $role) => Role::tryFrom($role))
            ->filter()
            ->values();

        $userRole = $user->role instanceof Role ? $user->role : Role::tryFrom((string) $user->role);

        if ($userRole === null || $allowed->isEmpty()) {
            return response()->json([
                'error' => [
                    'code' => 'forbidden',
                    'message' => 'Forbidden.',
                ],
            ], 403);
        }

        $ok = $allowed->contains(
            fn (Role $required) => $userRole->isAtLeast($required)
        );

        if (! $ok) {
            return response()->json([
                'error' => [
                    'code' => 'forbidden',
                    'message' => 'Forbidden.',
                ],
            ], 403);
        }

        return $next($request);
    }
}
