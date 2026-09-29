<?php

use App\Http\Middleware\EnsureRole;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
        ]);

        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            $requestId = (string) ($request->headers->get('X-Request-Id') ?: (string) Str::ulid());

            if ($e instanceof ValidationException) {
                return response()->json([
                    'error' => [
                        'code' => 'validation_failed',
                        'message' => $e->getMessage() ?: 'The given data was invalid.',
                        'fields' => $e->errors(),
                        'request_id' => $requestId,
                    ],
                ], 422);
            }

            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'error' => [
                        'code' => 'unauthenticated',
                        'message' => 'Unauthenticated.',
                        'request_id' => $requestId,
                    ],
                ], 401);
            }

            if ($e instanceof AuthorizationException) {
                return response()->json([
                    'error' => [
                        'code' => 'forbidden',
                        'message' => 'Forbidden.',
                        'request_id' => $requestId,
                    ],
                ], 403);
            }

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                return response()->json([
                    'error' => [
                        'code' => 'not_found',
                        'message' => 'Resource not found.',
                        'request_id' => $requestId,
                    ],
                ], 404);
            }

            if ($e instanceof TooManyRequestsHttpException) {
                $retry = $e->getHeaders()['Retry-After'] ?? 60;

                return response()->json([
                    'error' => [
                        'code' => 'rate_limited',
                        'message' => 'Too many requests.',
                        'request_id' => $requestId,
                    ],
                ], 429)->header('Retry-After', $retry);
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $code = match (true) {
                    $status === 400 => 'bad_request',
                    $status === 401 => 'unauthenticated',
                    $status === 403 => 'forbidden',
                    $status === 404 => 'not_found',
                    $status === 409 => 'conflict',
                    $status === 413 => 'file_too_large',
                    $status === 422 => 'validation_failed',
                    $status === 429 => 'rate_limited',
                    $status >= 500 => 'server_error',
                    default => 'bad_request',
                };

                return response()->json([
                    'error' => [
                        'code' => $code,
                        'message' => $status >= 500 ? 'Server error.' : ($e->getMessage() ?: 'Request failed.'),
                        'request_id' => $requestId,
                    ],
                ], $status);
            }

            report($e);

            return response()->json([
                'error' => [
                    'code' => 'server_error',
                    'message' => 'Server error.',
                    'request_id' => $requestId,
                ],
            ], 500);
        });
    })->create();
