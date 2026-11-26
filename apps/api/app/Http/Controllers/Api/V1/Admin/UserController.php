<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\AdjustXpAction;
use App\Actions\Admin\BanUserAction;
use App\Actions\Admin\ChangeUserRoleAction;
use App\Actions\Admin\UnlockUserAction;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustXpRequest;
use App\Http\Requests\Admin\BanUserRequest;
use App\Http\Requests\Admin\ChangeRoleRequest;
use App\Http\Requests\Admin\UserIndexRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Staff user management. Admin-only (nested `role:admin` route group):
 * moderators manage content, never accounts.
 */
class UserController extends Controller
{
    public function index(UserIndexRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();

        $query = User::query()->latest('id');

        if (isset($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (isset($filters['q'])) {
            $query->where(fn ($q) => $q
                ->where('name', 'ilike', '%'.$filters['q'].'%')
                ->orWhere('email', 'ilike', '%'.$filters['q'].'%'));
        }

        return AdminUserResource::collection($query->paginate($filters['per_page'] ?? 20));
    }

    public function show(User $user): AdminUserResource
    {
        return new AdminUserResource($user);
    }

    public function ban(BanUserRequest $request, User $user, BanUserAction $action): AdminUserResource
    {
        return new AdminUserResource($action->execute(
            $request->user(), $user, $request->string('reason')->toString(), $request,
        ));
    }

    public function unban(Request $request, User $user, BanUserAction $action): AdminUserResource
    {
        return new AdminUserResource($action->unban($request->user(), $user, $request));
    }

    public function unlock(Request $request, User $user, UnlockUserAction $action): AdminUserResource
    {
        return new AdminUserResource($action->execute($request->user(), $user, $request));
    }

    public function changeRole(ChangeRoleRequest $request, User $user, ChangeUserRoleAction $action): AdminUserResource
    {
        $role = Role::from($request->string('role')->toString());

        return new AdminUserResource($action->execute($request->user(), $user, $role, $request));
    }

    public function adjustXp(AdjustXpRequest $request, User $user, AdjustXpAction $action): JsonResponse
    {
        $validated = $request->validated();

        $updated = $action->execute($request->user(), $user, (int) $validated['amount'], $validated['reason'], $request);

        return response()->json(['data' => new AdminUserResource($updated)]);
    }
}
