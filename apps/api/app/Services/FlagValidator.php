<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\FlagValidationType;
use App\Models\Challenge;
use App\Models\ChallengeFlag;
use RuntimeException;

/**
 * Static flag validation (docs/security.md §5).
 *
 *  - Fast comparison uses HMAC-SHA256(flag, APP_KEY) + hash_equals().
 *  - Ciphertext uses AES-256-GCM with a key derived from APP_KEY
 *    (HKDF-SHA256, info 'ctf-flag-v1'); payload is
 *    base64(iv || tag || ciphertext). Implemented with openssl directly
 *    so the application cipher stays untouched.
 *  - Plaintext flags never touch logs, responses, or the database.
 */
class FlagValidator
{
    public static function normalize(string $flag, bool $caseSensitive): string
    {
        $flag = trim($flag);

        return $caseSensitive ? $flag : strtolower($flag);
    }

    public static function hash(string $flag, bool $caseSensitive = true): string
    {
        return hash_hmac('sha256', self::normalize($flag, $caseSensitive), self::hmacKey());
    }

    public static function matches(string $submitted, ChallengeFlag $flag): bool
    {
        return hash_equals($flag->flag_hash, self::hash($submitted, (bool) $flag->case_sensitive));
    }

    /**
     * Return the accepted flag row matching the submission, or null.
     * Only `static` challenges are supported in V1.
     */
    public static function check(string $submitted, Challenge $challenge): ?ChallengeFlag
    {
        if ($challenge->flag_validation_type !== FlagValidationType::Static) {
            return null;
        }

        $flags = $challenge->relationLoaded('flags')
            ? $challenge->flags
            : $challenge->flags()->where('is_active', true)->get();

        foreach ($flags as $flag) {
            if (! $flag->is_active) {
                continue;
            }

            if (self::matches($submitted, $flag)) {
                return $flag;
            }
        }

        return null;
    }

    /**
     * Encrypt a plaintext flag for storage (admin authoring path only).
     */
    public static function encrypt(string $flag): string
    {
        $iv = random_bytes(12);
        $tag = '';

        $ciphertext = openssl_encrypt(
            $flag,
            'aes-256-gcm',
            self::encryptionKey(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
        );

        if ($ciphertext === false) {
            throw new RuntimeException('Flag encryption failed.');
        }

        return base64_encode($iv.$tag.$ciphertext);
    }

    /**
     * Decrypt for administrative verification flows only. The result must
     * never be logged, serialized, or returned in a response.
     */
    public static function decrypt(string $payload): string
    {
        $raw = base64_decode($payload, true);

        if ($raw === false || strlen($raw) < 28) {
            throw new RuntimeException('Invalid flag payload.');
        }

        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $ciphertext = substr($raw, 28);

        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            self::encryptionKey(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
        );

        if ($plaintext === false) {
            throw new RuntimeException('Flag decryption failed.');
        }

        return $plaintext;
    }

    private static function hmacKey(): string
    {
        return (string) config('app.key');
    }

    private static function encryptionKey(): string
    {
        return hash_hkdf('sha256', (string) config('app.key'), 32, 'ctf-flag-v1');
    }
}
