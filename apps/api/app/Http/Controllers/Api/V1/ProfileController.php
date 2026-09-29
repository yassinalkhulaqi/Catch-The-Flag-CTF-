<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

final class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->safe()->only(['name', 'bio', 'avatar_path']));
        $user->save();

        return response()->json(['data' => new UserResource($user->fresh())]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->forceFill(['password' => Hash::make($request->validated('password'))])->save();
        $user->tokens()->where('id', '!=', $user->currentAccessToken()?->id)->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
