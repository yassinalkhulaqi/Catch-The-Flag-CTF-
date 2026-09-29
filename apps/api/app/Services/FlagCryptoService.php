<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

final class FlagCryptoService
{
    public function encrypt(string $plaintext): string
    {
        return Crypt::encryptString($plaintext);
    }

    public function decrypt(string $ciphertext): string
    {
        return Crypt::decryptString($ciphertext);
    }

    public function normalize(string $flag, bool $caseSensitive = true): string
    {
        $normalized = trim($flag);
        $normalized = Str::replace("\0", '', $normalized);

        if (! $caseSensitive) {
            $normalized = Str::lower($normalized);
        }

        return $normalized;
    }

    public function hmacHash(string $normalizedFlag): string
    {
        return hash_hmac('sha256', $normalizedFlag, $this->hmacKey());
    }

    public function verify(string $submitted, string $storedHash, bool $caseSensitive = true): bool
    {
        $normalized = $this->normalize($submitted, $caseSensitive);
        $computed = $this->hmacHash($normalized);

        return hash_equals($storedHash, $computed);
    }

    public function hashPrefixForLog(string $flagHash): string
    {
        return substr($flagHash, 0, 12);
    }

    private function hmacKey(): string
    {
        $key = (string) config('app.key');

        if (str_starts_with($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);

            return $decoded !== false ? $decoded : $key;
        }

        return $key;
    }
}
