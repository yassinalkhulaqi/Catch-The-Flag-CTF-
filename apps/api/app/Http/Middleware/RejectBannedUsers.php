<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Exceptions\AccountBannedException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Suspended accounts cannot use the API at all (docs/security.md §2).
 * Must run after authentication on every authenticated route group.
 */
class RejectBannedUsers
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->isBanned()) {
            throw new AccountBannedException;
        }

        return $next($request);
    }
}
