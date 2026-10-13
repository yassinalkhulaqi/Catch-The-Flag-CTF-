<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ChallengeFileService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Store an uploaded challenge file (validation + UUID-keyed storage
 * via ChallengeFileService) and audit the metadata row.
 */
class StoreChallengeFileAction
{
    public function execute(
        User $actor,
        Challenge $challenge,
        UploadedFile $upload,
        ChallengeFileService $files,
        Request $request,
    ): ChallengeFile {
        return DB::transaction(function () use ($actor, $challenge, $upload, $files, $request): ChallengeFile {
            $file = $files->store($challenge, $upload);

            AuditLogger::log(
                $actor,
                'challenge_file.created',
                ChallengeFile::class,
                $file->id,
                ['before' => null, 'after' => $file->only(['challenge_id', 'original_name', 'mime_type', 'size_bytes', 'checksum_sha256'])],
                $request,
            );

            return $file;
        });
    }
}
