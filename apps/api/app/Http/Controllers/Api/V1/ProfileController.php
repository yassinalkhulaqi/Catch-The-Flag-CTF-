<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auth\PasswordAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

/**
 * Own-profile mutations. Users can only ever touch their own row:
 * the target is always the authenticated user, never an id from input.
 */
class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, PasswordAction $action): JsonResponse
    {
        $user = $action->updateProfile(
            $request->user(),
            $request->safe()->except('avatar'),
            $request->file('avatar'),
        );

        return response()->json(['data' => new UserResource($user)]);
    }

    public function updatePassword(UpdatePasswordRequest $request, PasswordAction $action): JsonResponse
    {
        $action->updatePassword(
            $request->user(),
            $request->string('password')->toString(),
        );

        return response()->json(['data' => ['updated' => true]]);
    }
}
