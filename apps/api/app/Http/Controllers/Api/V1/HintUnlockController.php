<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\UnlockHintAction;
use App\Http\Controllers\Controller;
use App\Models\Challenge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Idempotent hint reveal. The hint must belong to the challenge
 * (scoped lookup); invisible challenges are 404.
 */
class HintUnlockController extends Controller
{
    public function store(
        Request $request,
        string $challenge,
        int $hint,
        UnlockHintAction $action,
    ): JsonResponse {
        $model = $this->resolve($challenge);

        if ($model === null || Gate::denies('view', $model)) {
            abort(404);
        }

        $hintModel = $model->hints()->where('id', $hint)->firstOrFail();

        $result = $action->execute($request->user(), $model, $hintModel);

        return response()->json(['data' => [
            'hint' => ['id' => $hintModel->id, 'content' => $result['content']],
            'points_remaining' => $result['points_remaining'],
            'already_unlocked' => $result['already_unlocked'],
        ]]);
    }

    private function resolve(string $key): ?Challenge
    {
        $query = Challenge::query();

        if (ctype_digit($key)) {
            $query->where('id', (int) $key)->orWhere('slug', $key);
        } else {
            $query->where('slug', $key);
        }

        return $query->first();
    }
}
