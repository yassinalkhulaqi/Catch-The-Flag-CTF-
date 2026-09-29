<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\LoginUser;
use App\Actions\RegisterUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

final class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUser $action): JsonResponse
    {
        $result = $action->handle($request->validated());

        return response()->json([
            'data' => [
                'user' => (new UserResource($result['user']))->resolve(),
                'token' => $result['token'],
                'expires_at' => $result['expires_at']->toIso8601String(),
            ],
        ], 201);
    }

    public function login(LoginRequest $request, LoginUser $action): JsonResponse
    {
        $result = $action->handle($request->validated());

        return response()->json([
            'data' => [
                'user' => (new UserResource($result['user']))->resolve(),
                'token' => $result['token'],
                'expires_at' => $result['expires_at']->toIso8601String(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()?->tokens()->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadCount('userAchievements as achievements_count');

        return response()->json([
            'data' => (new UserResource($user))->resolve(),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json(['data' => ['ok' => true]], 202);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'error' => [
                    'code' => 'validation_failed',
                    'message' => 'Unable to reset password.',
                    'fields' => ['email' => [__($status)]],
                ],
            ], 422);
        }

        return response()->json(['data' => ['ok' => true]]);
    }
}
