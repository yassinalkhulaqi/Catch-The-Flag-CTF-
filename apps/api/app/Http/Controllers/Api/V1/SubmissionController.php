<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\SubmitFlagAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitFlagRequest;
use App\Models\Challenge;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Thin submission endpoint: resolve → authorize → action → outcome.
 * Denials on invisible challenges are 404 (no existence oracle).
 */
class SubmissionController extends Controller
{
    public function store(
        SubmitFlagRequest $request,
        string $challenge,
        SubmitFlagAction $action,
    ): JsonResponse {
        $model = $this->resolve($challenge);

        if ($model === null || Gate::denies('view', $model)) {
            abort(404);
        }

        $outcome = $action->execute(
            $request->user(),
            $model,
            $request->string('flag')->toString(),
            $request->ip() ?? '0.0.0.0',
            $request->userAgent(),
        );

        return response()->json(['data' => $outcome]);
    }

    private function resolve(string $key): ?Challenge
    {
        $query = Challenge::query();

        // Numeric keys may be ids; anything else is slug-only so
        // PostgreSQL never sees a non-numeric comparison on the id column.
        if (ctype_digit($key)) {
            $query->where('id', (int) $key)->orWhere('slug', $key);
        } else {
            $query->where('slug', $key);
        }

        return $query->first();
    }
}
