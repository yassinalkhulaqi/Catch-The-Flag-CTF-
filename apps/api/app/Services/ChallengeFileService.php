<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Challenge;
use App\Models\ChallengeFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class ChallengeFileService
{
    public function store(Challenge $challenge, UploadedFile $upload): ChallengeFile
    {
        $this->assertWithinSizeLimit($upload);

        $originalName = $this->sanitizeOriginalName($upload->getClientOriginalName());
        $detectedMime = $this->detectMime($upload);
        $this->assertAllowedMime($detectedMime);

        $extension = strtolower($upload->getClientOriginalExtension() ?: pathinfo($originalName, PATHINFO_EXTENSION));
        $extension = preg_replace('/[^a-z0-9]+/i', '', (string) $extension) ?: 'bin';
        $storageKey = Str::uuid()->toString().'/'.Str::uuid()->toString().'.'.$extension;

        $disk = 'challenge-files';
        $stream = fopen($upload->getRealPath(), 'rb');
        if ($stream === false) {
            throw new InvalidArgumentException('Unable to read uploaded file.');
        }

        Storage::disk($disk)->put($storageKey, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        $checksum = hash_file('sha256', $upload->getRealPath()) ?: '';
        $size = $upload->getSize() ?: Storage::disk($disk)->size($storageKey);

        return ChallengeFile::query()->create([
            'challenge_id' => $challenge->id,
            'original_name' => $originalName,
            'storage_disk' => $disk,
            'storage_key' => $storageKey,
            'mime_type' => $detectedMime,
            'size_bytes' => $size,
            'checksum_sha256' => $checksum,
            'visibility' => 'authenticated',
        ]);
    }

    public function replace(ChallengeFile $file, UploadedFile $upload): ChallengeFile
    {
        $oldKey = $file->storage_key;
        $oldDisk = $file->storage_disk;

        $this->assertWithinSizeLimit($upload);
        $originalName = $this->sanitizeOriginalName($upload->getClientOriginalName());
        $detectedMime = $this->detectMime($upload);
        $this->assertAllowedMime($detectedMime);

        $extension = strtolower($upload->getClientOriginalExtension() ?: pathinfo($originalName, PATHINFO_EXTENSION));
        $extension = preg_replace('/[^a-z0-9]+/i', '', (string) $extension) ?: 'bin';
        $storageKey = Str::uuid()->toString().'/'.Str::uuid()->toString().'.'.$extension;

        $disk = 'challenge-files';
        $stream = fopen($upload->getRealPath(), 'rb');
        if ($stream === false) {
            throw new InvalidArgumentException('Unable to read uploaded file.');
        }
        Storage::disk($disk)->put($storageKey, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        $file->forceFill([
            'original_name' => $originalName,
            'storage_disk' => $disk,
            'storage_key' => $storageKey,
            'mime_type' => $detectedMime,
            'size_bytes' => $upload->getSize() ?: Storage::disk($disk)->size($storageKey),
            'checksum_sha256' => hash_file('sha256', $upload->getRealPath()) ?: '',
        ])->save();

        Storage::disk($oldDisk)->delete($oldKey);

        return $file->refresh();
    }

    public function delete(ChallengeFile $file): void
    {
        Storage::disk($file->storage_disk)->delete($file->storage_key);
        $file->delete();
    }

    public function streamDownload(ChallengeFile $file): StreamedResponse
    {
        $disk = Storage::disk($file->storage_disk);

        return response()->streamDownload(function () use ($disk, $file): void {
            $stream = $disk->readStream($file->storage_key);
            if ($stream === false) {
                return;
            }
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $file->original_name, [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Disposition' => 'attachment; filename="'.$this->headerSafeFilename($file->original_name).'"',
        ]);
    }

    public function sanitizeOriginalName(string $name): string
    {
        $name = str_replace(["\0", "\r", "\n"], '', $name);
        $name = basename(str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $name));
        $name = preg_replace('/[^\P{C}\s]+/u', '', $name) ?? 'file';
        $name = trim($name);
        if ($name === '' || $name === '.' || $name === '..') {
            $name = 'file.bin';
        }

        return Str::limit($name, 255, '');
    }

    private function detectMime(UploadedFile $upload): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detected = $finfo->file($upload->getRealPath()) ?: 'application/octet-stream';

        return $detected;
    }

    private function assertAllowedMime(string $mime): void
    {
        $allowed = config('ctf.uploads.allowed_mime_types', []);
        if (! in_array($mime, $allowed, true)) {
            throw new InvalidArgumentException('File type is not allowed.');
        }
    }

    private function assertWithinSizeLimit(UploadedFile $upload): void
    {
        $maxMb = (int) config('ctf.uploads.max_file_mb', 64);
        $maxBytes = $maxMb * 1024 * 1024;
        if (($upload->getSize() ?? 0) > $maxBytes) {
            throw new InvalidArgumentException('File exceeds maximum allowed size.');
        }
    }

    private function headerSafeFilename(string $name): string
    {
        return str_replace(['"', "\r", "\n"], '', $name);
    }
}
