<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Challenge;
use App\Models\ChallengeFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Challenge file storage (docs/security.md §6). Every byte is hostile:
 * MIME is detected server-side with finfo, storage keys are UUIDs, and
 * archives are never extracted. Downloads always stream as attachments.
 */
class ChallengeFileService
{
    public const DISK = 'challenge-files';

    /**
     * Validate + persist an uploaded challenge file. Returns the metadata row.
     *
     * @throws HttpException 413 when over the configured limit, 422 on MIME.
     */
    public function store(Challenge $challenge, UploadedFile $file): ChallengeFile
    {
        $maxBytes = (int) config('ctf.uploads.max_file_mb') * 1024 * 1024;

        if ($file->getSize() === false || $file->getSize() > $maxBytes) {
            throw new HttpException(413, 'File exceeds the configured size limit.');
        }

        // Server-side detection: never trust the client extension or MIME.
        $detected = $file->getMimeType();

        if (! in_array($detected, (array) config('ctf.uploads.allowed_mime_types'), true)) {
            throw new HttpException(422, 'File type is not allowed.');
        }

        $disk = Storage::disk(self::DISK);
        $key = 'challenges/'.$challenge->id.'/'.Str::uuid().'.'.$this->safeExtension($file->getClientOriginalName());

        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            throw new HttpException(422, 'Uploaded file could not be read.');
        }

        $disk->put($key, $contents);

        return ChallengeFile::forceCreate([
            'challenge_id' => $challenge->id,
            'original_name' => $this->sanitizeName($file->getClientOriginalName()),
            'storage_disk' => self::DISK,
            'storage_key' => $key,
            'mime_type' => $detected,
            'size_bytes' => $file->getSize(),
            'checksum_sha256' => hash('sha256', $contents),
            'visibility' => 'private',
        ]);
    }

    /**
     * Authorized streaming download. Always attachment + octet-stream +
     * nosniff: challenge files may be live malware samples.
     */
    public function downloadResponse(ChallengeFile $file): StreamedResponse
    {
        $disk = Storage::disk($file->storage_disk);

        if (! $disk->exists($file->storage_key)) {
            abort(404, 'Resource not found.');
        }

        return $disk->response(
            $file->storage_key,
            $file->original_name,
            [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="'.$this->asciiFilename($file->original_name).'"',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    /**
     * Metadata-only sanitization: strip path separators and control chars.
     * The result is never used as a filesystem path.
     */
    public function sanitizeName(string $name): string
    {
        $name = str_replace(['/', '\\'], '_', $name);
        $name = (string) preg_replace('/[\x00-\x1F\x7F]/', '', $name);
        $name = trim($name, ' .');

        if ($name === '') {
            $name = 'file';
        }

        return mb_substr($name, 0, 255);
    }

    private function safeExtension(string $originalName): string
    {
        $ext = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
        $ext = (string) preg_replace('/[^a-z0-9]/', '', $ext);

        return $ext !== '' ? substr($ext, 0, 12) : 'bin';
    }

    private function asciiFilename(string $name): string
    {
        $ascii = (string) preg_replace('/[^\x20-\x7E]/', '_', $name);

        return $ascii !== '' ? $ascii : 'download';
    }
}
