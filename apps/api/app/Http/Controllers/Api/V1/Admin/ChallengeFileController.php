<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\DeleteChallengeFileAction;
use App\Actions\Admin\ReplaceChallengeFileAction;
use App\Actions\Admin\StoreChallengeFileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChallengeFileRequest;
use App\Http\Resources\Admin\AdminFileResource;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Services\ChallengeFileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff file management: multipart upload, metadata view, byte
 * replacement, and deletion. Storage keys stay server-side; only
 * metadata is serialized.
 */
class ChallengeFileController extends Controller
{
    public function index(Challenge $challenge): JsonResponse
    {
        $files = $challenge->files()->latest('id')->get();

        return response()->json(['data' => AdminFileResource::collection($files)]);
    }

    public function store(ChallengeFileRequest $request, Challenge $challenge, ChallengeFileService $files, StoreChallengeFileAction $action): JsonResponse
    {
        $file = $action->execute($request->user(), $challenge, $request->file('file'), $files, $request);

        return response()->json(['data' => new AdminFileResource($file)], 201);
    }

    public function show(Challenge $challenge, ChallengeFile $file): AdminFileResource
    {
        $this->scope($challenge, $file);

        return new AdminFileResource($file);
    }

    public function replace(
        ChallengeFileRequest $request,
        Challenge $challenge,
        ChallengeFile $file,
        ChallengeFileService $files,
        ReplaceChallengeFileAction $action,
    ): AdminFileResource {
        $this->scope($challenge, $file);

        return new AdminFileResource($action->execute(
            $request->user(), $challenge, $file, $request->file('file'), $files, $request,
        ));
    }

    public function destroy(Request $request, Challenge $challenge, ChallengeFile $file, DeleteChallengeFileAction $action): JsonResponse
    {
        $this->scope($challenge, $file);

        $action->execute($request->user(), $file, $request);

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function scope(Challenge $challenge, ChallengeFile $file): void
    {
        if ($file->challenge_id !== $challenge->id) {
            abort(404);
        }
    }
}
