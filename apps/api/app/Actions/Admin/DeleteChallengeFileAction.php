<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\ChallengeFile;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Delete a challenge file: remove the stored object first, then
 * soft-delete the metadata row, then audit.
 */
class DeleteChallengeFileAction
{
    public function execute(User $actor, ChallengeFile $file, Request $request): void
    {
        DB::transaction(function () use ($actor, $file, $request): void {
            $before = $file->only(['challenge_id', 'original_name', 'mime_type', 'size_bytes', 'checksum_sha256']);
            $fileId = $file->id;

            Storage::disk($file->storage_disk)->delete($file->storage_key);
            $file->delete();

            AuditLogger::log(
                $actor,
                'challenge_file.deleted',
                ChallengeFile::class,
                $fileId,
                ['before' => $before, 'after' => null],
                $request,
            );
        });
    }
}
