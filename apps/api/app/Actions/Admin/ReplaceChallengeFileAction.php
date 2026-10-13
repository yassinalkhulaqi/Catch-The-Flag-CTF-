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
use Illuminate\Support\Facades\Storage;

/**
 * Replace a challenge file's bytes. The new upload is validated and
 * written under a fresh server-generated UUID key (via
 * ChallengeFileService, so size/MIME rules stay identical to upload);
 * only then is the metadata row repointed and the old object deleted.
 * The old bytes are never reachable under the new key and vice versa.
 */
class ReplaceChallengeFileAction
{
    public function execute(
        User $actor,
        Challenge $challenge,
        ChallengeFile $file,
        UploadedFile $upload,
        ChallengeFileService $files,
        Request $request,
    ): ChallengeFile {
        return DB::transaction(function () use ($actor, $challenge, $file, $upload, $files, $request): ChallengeFile {
            $before = $file->only(['original_name', 'mime_type', 'size_bytes', 'checksum_sha256']);
            $oldKey = $file->storage_key;
            $oldDisk = $file->storage_disk;

            // Validates + writes bytes under a new UUID key (temporary row).
            $staged = $files->store($challenge, $upload);
            $stagedAttributes = $staged->only([
                'original_name', 'storage_disk', 'storage_key',
                'mime_type', 'size_bytes', 'checksum_sha256',
            ]);

            // The staged row only existed to reuse validation/storage
            // logic — remove it BEFORE repointing, storage_key is unique.
            $staged->forceDelete();

            $file->forceFill($stagedAttributes);
            $file->save();

            Storage::disk($oldDisk)->delete($oldKey);

            $file->refresh();

            AuditLogger::log(
                $actor,
                'challenge_file.replaced',
                ChallengeFile::class,
                $file->id,
                ['before' => $before, 'after' => $file->only(['original_name', 'mime_type', 'size_bytes', 'checksum_sha256'])],
                $request,
            );

            return $file;
        });
    }
}
