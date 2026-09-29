<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\UploadChallengeFileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UploadChallengeFileRequest;
use App\Http\Resources\ChallengeFileResource;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Services\AuditLogger;
use App\Services\ChallengeFileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class AdminChallengeFileController extends Controller
{
    public function index(Challenge $challenge): JsonResponse
    {
        $this->authorize('update', $challenge);

        return response()->json(['data' => ChallengeFileResource::collection($challenge->files)]);
    }

    public function store(UploadChallengeFileRequest $request, Challenge $challenge, UploadChallengeFileAction $action): JsonResponse
    {
        $this->authorize('update', $challenge);
        $file = $action->handle($request->user(), $challenge, $request->file('file'));

        return response()->json(['data' => new ChallengeFileResource($file)], 201);
    }

    public function replace(
        UploadChallengeFileRequest $request,
        Challenge $challenge,
        ChallengeFile $file,
        ChallengeFileService $files,
        AuditLogger $audit,
    ): JsonResponse {
        if ($file->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Not found.');
        }
        $this->authorize('update', $challenge);
        $updated = $files->replace($file, $request->file('file'));
        $audit->log($request->user(), 'challenge.file.replace', $challenge, [
            'file_id' => $updated->id,
            'original_name' => $updated->original_name,
        ]);

        return response()->json(['data' => new ChallengeFileResource($updated)]);
    }

    public function destroy(Request $request, Challenge $challenge, ChallengeFile $file, ChallengeFileService $files, AuditLogger $audit): JsonResponse
    {
        if ($file->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Not found.');
        }
        $this->authorize('update', $challenge);
        $audit->log($request->user(), 'challenge.file.delete', $challenge, ['file_id' => $file->id]);
        $files->delete($file);

        return response()->json(['data' => ['ok' => true]]);
    }
}
