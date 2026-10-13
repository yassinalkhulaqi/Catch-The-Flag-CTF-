<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\FlagValidationType;
use App\Models\Challenge;
use App\Services\FlagValidator;
use Tests\TestCase;

class FlagValidatorTest extends TestCase
{
    public function test_hash_is_stable_and_keyed(): void
    {
        $this->assertSame(FlagValidator::hash('CTF{abc}'), FlagValidator::hash('  CTF{abc}  '));
        $this->assertNotSame(FlagValidator::hash('CTF{abc}'), FlagValidator::hash('CTF{abd}'));
        $this->assertSame(64, strlen(FlagValidator::hash('CTF{abc}')));
    }

    public function test_case_insensitive_flags_match(): void
    {
        $this->assertSame(FlagValidator::hash('ctf{abc}', false), FlagValidator::hash('CTF{ABC}', false));
        $this->assertNotSame(FlagValidator::hash('ctf{abc}', true), FlagValidator::hash('CTF{ABC}', true));
    }

    public function test_encrypt_decrypt_roundtrip(): void
    {
        $ciphertext = FlagValidator::encrypt('CTF{secret-flag}');

        $this->assertNotSame('CTF{secret-flag}', $ciphertext);
        $this->assertStringNotContainsString('secret-flag', $ciphertext);
        $this->assertSame('CTF{secret-flag}', FlagValidator::decrypt($ciphertext));
    }

    public function test_check_ignores_inactive_and_non_static(): void
    {
        $challenge = new Challenge([
            'flag_validation_type' => FlagValidationType::PerUser,
        ]);

        $this->assertNull(FlagValidator::check('CTF{anything}', $challenge));
    }
}
