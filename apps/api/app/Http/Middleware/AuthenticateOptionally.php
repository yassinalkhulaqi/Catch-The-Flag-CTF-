<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Optional token authentication for public routes (docs/api.md §3).
 * Resolves a Sanctum bearer token when present so policies and
 * resources can personalize (solved state, progress) — but never
 * rejects guests. Must run before `banned` so suspended accounts
 * are still locked out of public reads.
 */
class AuthenticateOptionally
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = null;

        try {
            $user = Auth::guard('sanctum')->user();
        } catch (Throwable) {
            $user = null;
        }

        if ($user !== null) {
            $request->setUserResolver(static fn (?string $guard = null): mixed => $user);
            Auth::setUser($user);
        }

        return $next($request);
    }
}
