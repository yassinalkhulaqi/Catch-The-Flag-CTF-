<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auth\LoginUserAction;
use App\Actions\Auth\PasswordAction;
use App\Actions\Auth\RegisterUserAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thin auth controller: validate → action → resource.
 * Token plaintext appears here once; the BFF moves it into an
 * httpOnly cookie and never exposes it to JavaScript.
 */
class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $result = $action->execute($request->validated());

        return response()->json([
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
                'expires_at' => $result['expires_at'],
            ],
        ], 201);
    }

    public function login(LoginRequest $request, LoginUserAction $action): JsonResponse
    {
        $result = $action->execute(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
        );

        return response()->json([
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
                'expires_at' => $result['expires_at'],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['data' => ['revoked' => true]]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['data' => ['revoked' => true]]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => new UserResource($user),
            'meta' => [
                'unread_notifications_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request, PasswordAction $action): JsonResponse
    {
        $action->sendResetLink($request->string('email')->toString());

        return response()->json(['data' => ['sent' => true]], 202);
    }

    public function resetPassword(ResetPasswordRequest $request, PasswordAction $action): JsonResponse
    {
        $ok = $action->resetPassword($request->validated());

        if (! $ok) {
            return response()->json([
                'error' => [
                    'code' => 'bad_request',
                    'message' => 'This reset link is invalid or has expired.',
                ],
            ], 400);
        }

        return response()->json(['data' => ['reset' => true]]);
    }
}
