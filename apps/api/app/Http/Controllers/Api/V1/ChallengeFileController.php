<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Services\ChallengeFileService;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class ChallengeFileController extends Controller
{
    public function download(Challenge $challenge, ChallengeFile $file, ChallengeFileService $files): StreamedResponse
    {
        if ($file->challenge_id !== $challenge->id) {
            throw new HttpException(404, 'Not found.');
        }

        $this->authorize('download', $file);

        return $files->streamDownload($file);
    }
}
