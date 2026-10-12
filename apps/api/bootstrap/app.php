<?php

use App\Exceptions\AccountBannedException;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\RejectBannedUsers;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Exception\RequestExceptionInterface;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureRole::class,
            'banned' => RejectBannedUsers::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $isApi = static fn (Request $request): bool => $request->is('api/*') || $request->expectsJson();

        $requestId = static function (Request $request): string {
            if (! $request->attributes->has('request_id')) {
                $request->attributes->set('request_id', (string) Str::uuid());
            }

            return $request->attributes->get('request_id');
        };

        /**
         * Uniform API envelope (docs/api.md §1.1). Secrets, SQL and stack
         * traces never leave the server; every error carries a request_id
         * for log correlation.
         */
        $envelope = static function (Request $request, int $status, string $code, string $message, array $fields = []) use ($requestId): JsonResponse {
            $response = response()->json(array_filter([
                'error' => array_filter([
                    'code' => $code,
                    'message' => $message,
                    'fields' => $fields !== [] ? $fields : null,
                    'request_id' => $requestId($request),
                ]),
            ]), $status);

            if ($request->attributes->has('retry_after')) {
                $response->headers->set('Retry-After', (string) $request->attributes->get('retry_after'));
            }

            return $response;
        };

        $exceptions->render(function (ValidationException $e, Request $request) use ($envelope, $isApi): ?JsonResponse {
            return $isApi($request)
                ? $envelope($request, 422, 'validation_failed', 'The given data was invalid.', $e->errors())
                : null;
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) use ($envelope, $isApi): ?JsonResponse {
            return $isApi($request)
                ? $envelope($request, 401, 'unauthenticated', 'Authentication required.')
                : null;
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) use ($envelope, $isApi): ?JsonResponse {
            return $isApi($request)
                ? $envelope($request, 403, 'forbidden', 'You do not have permission to perform this action.')
                : null;
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) use ($envelope, $isApi): ?JsonResponse {
            return $isApi($request)
                ? $envelope($request, 404, 'not_found', 'Resource not found.')
                : null;
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) use ($envelope, $isApi): ?JsonResponse {
            return $isApi($request)
                ? $envelope($request, 404, 'not_found', 'Resource not found.')
                : null;
        });

        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) use ($envelope, $isApi): ?JsonResponse {
            if (! $isApi($request)) {
                return null;
            }

            $request->attributes->set('retry_after', $e->getHeaders()['Retry-After'] ?? 60);

            return $envelope($request, 429, 'rate_limited', 'Too many requests. Slow down and try again.');
        });

        $exceptions->render(function (AccountBannedException $e, Request $request) use ($envelope, $isApi): ?JsonResponse {
            return $isApi($request)
                ? $envelope($request, 403, 'account_banned', 'This account has been suspended.')
                : null;
        });

        $exceptions->render(function (Throwable $e, Request $request) use ($envelope, $isApi, $requestId): ?JsonResponse {
            if (! $isApi($request)) {
                return null;
            }

            // Specific renderers above own these; never swallow them here
            // regardless of callback evaluation order.
            if (
                $e instanceof ValidationException
                || $e instanceof AuthenticationException
                || $e instanceof AuthorizationException
                || $e instanceof AccountBannedException
                || $e instanceof NotFoundHttpException
                || $e instanceof ModelNotFoundException
                || $e instanceof TooManyRequestsHttpException
            ) {
                return null;
            }

            if ($e instanceof HttpExceptionInterface && $e->getStatusCode() !== 500) {
                $map = [400 => 'bad_request', 403 => 'forbidden', 409 => 'conflict', 413 => 'file_too_large'];
                $code = $map[$e->getStatusCode()] ?? 'bad_request';

                return $envelope($request, $e->getStatusCode(), $code, $e->getMessage() !== '' ? $e->getMessage() : 'Request failed.');
            }

            if ($e instanceof RequestExceptionInterface) {
                return $envelope($request, 400, 'bad_request', 'Malformed request.');
            }

            Log::error('Unhandled API exception', [
                'request_id' => $requestId($request),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return $envelope($request, 500, 'server_error', 'Something went wrong.');
        });
    })->create();
