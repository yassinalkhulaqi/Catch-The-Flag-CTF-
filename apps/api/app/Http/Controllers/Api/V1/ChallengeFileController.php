<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Services\ChallengeFileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Authorized file streaming. The file id is a numeric lookup scoped to
 * the challenge — no user string ever reaches the filesystem, so path
 * traversal is structurally impossible (docs/security.md §6).
 */
class ChallengeFileController extends Controller
{
    public function download(
        Request $request,
        string $challenge,
        string $file,
        ChallengeFileService $files,
    ): StreamedResponse {
        $model = $this->resolve($challenge);

        if ($model === null || Gate::denies('view', $model)) {
            abort(404);
        }

        // Numeric id lookup only — encoded traversal ("%2e%2e", "..",
        // negative ids) is a 404, never a 500 (SecurityTest::g).
        if (! ctype_digit($file)) {
            abort(404);
        }

        $fileModel = $model->files()->where('id', (int) $file)->firstOrFail();

        return $files->downloadResponse($fileModel);
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
