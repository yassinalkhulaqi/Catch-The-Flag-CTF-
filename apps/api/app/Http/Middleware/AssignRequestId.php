<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request correlation (docs/architecture.md §7 Observability).
 *
 * Every response carries an `X-Request-Id` header so a user-reported failure
 * can be tied to a server log line. An inbound id is honoured only when it is
 * short and drawn from a safe charset; anything else is replaced with a fresh
 * UUID, so a hostile client cannot inject control characters or unbounded text
 * into logs.
 *
 * The id is the single source of truth for the error envelope as well: the
 * middleware stores it on the request, the exception renderers read it back
 * from there, and the response header always carries the same value.
 */
final class AssignRequestId
{
    public const HEADER = 'X-Request-Id';

    /**
     * Request attribute holding the correlation id.
     */
    public const ATTRIBUTE = 'request_id';

    /**
     * Inbound ids are accepted only when they match this pattern: 1-64
     * characters drawn from an unambiguous, log-safe charset.
     */
    private const SAFE_PATTERN = '/^[A-Za-z0-9._:-]{1,64}$/';

    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $this->resolve($request);

        $request->attributes->set(self::ATTRIBUTE, $requestId);

        // Log context is request-scoped and shared by every channel: the id
        // ends up in the "extra" block of each log record, which is what the
        // structured channel serialises.
        Context::add('request_id', $requestId);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set(self::HEADER, $requestId);

        return $response;
    }

    /**
     * Honour a well-formed inbound id, otherwise mint one.
     */
    private function resolve(Request $request): string
    {
        $inbound = $request->headers->get(self::HEADER);

        if (is_string($inbound) && preg_match(self::SAFE_PATTERN, $inbound) === 1) {
            return $inbound;
        }

        return (string) Str::uuid();
    }
}
