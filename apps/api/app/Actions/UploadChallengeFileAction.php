<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ChallengeFileService;
use Illuminate\Http\UploadedFile;

final class UploadChallengeFileAction
{
    public function __construct(
        private ChallengeFileService $files,
        private AuditLogger $audit,
    ) {}

    public function handle(User $actor, Challenge $challenge, UploadedFile $upload): ChallengeFile
    {
        $file = $this->files->store($challenge, $upload);

        $this->audit->log($actor, 'challenge.file.upload', $challenge, [
            'file_id' => $file->id,
            'original_name' => $file->original_name,
            'size_bytes' => $file->size_bytes,
            'mime_type' => $file->mime_type,
        ]);

        return $file;
    }
}
