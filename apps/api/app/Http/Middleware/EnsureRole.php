<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * Usage: ->middleware('role:admin,moderator'). Role hierarchy applies:
     * a higher role satisfies a lower requirement (admin >= moderator >= user).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'error' => [
                    'code' => 'unauthenticated',
                    'message' => 'Authentication required.',
                ],
            ], Response::HTTP_UNAUTHORIZED);
        }

        $required = array_map(
            static fn (string $role): Role => Role::from(strtolower(trim($role))),
            $roles,
        );

        foreach ($required as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        return response()->json([
            'error' => [
                'code' => 'forbidden',
                'message' => 'You do not have permission to perform this action.',
            ],
        ], Response::HTTP_FORBIDDEN);
    }
}
