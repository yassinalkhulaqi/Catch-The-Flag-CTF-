<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\AdjustUserXpAction;
use App\Actions\BanUserAction;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustXpRequest;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);
        $users = User::query()->orderBy('id')->paginate(20);

        return response()->json([
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json(['data' => new UserResource($user)]);
    }

    public function update(Request $request, User $user, AuditLogger $audit): JsonResponse
    {
        $this->authorize('update', $user);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:80'],
            'bio' => ['nullable', 'string', 'max:500'],
        ]);
        // Explicitly ignore role/xp/solved_count mass assignment
        $user->fill($data)->save();
        $audit->log($request->user(), 'user.update', $user, $data);

        return response()->json(['data' => new UserResource($user)]);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user, AuditLogger $audit): JsonResponse
    {
        $this->authorize('updateRole', $user);
        $before = $user->role?->value;
        $user->forceFill(['role' => $request->validated('role')])->save();
        $audit->log($request->user(), 'user.role_change', $user, [
            'before' => ['role' => $before],
            'after' => ['role' => $user->role?->value],
        ]);

        return response()->json(['data' => new UserResource($user)]);
    }

    public function ban(Request $request, User $user, BanUserAction $action): JsonResponse
    {
        $this->authorize('ban', $user);

        return response()->json(['data' => new UserResource($action->ban($request->user(), $user))]);
    }

    public function unban(Request $request, User $user, BanUserAction $action): JsonResponse
    {
        $this->authorize('ban', $user);

        return response()->json(['data' => new UserResource($action->unban($request->user(), $user))]);
    }

    public function adjustXp(AdjustXpRequest $request, User $user, AdjustUserXpAction $action): JsonResponse
    {
        $this->authorize('adjustXp', $user);
        $action->handle(
            $request->user(),
            $user,
            (int) $request->validated('amount'),
            (string) $request->validated('reason'),
        );

        return response()->json(['data' => new UserResource($user->fresh())]);
    }
}
