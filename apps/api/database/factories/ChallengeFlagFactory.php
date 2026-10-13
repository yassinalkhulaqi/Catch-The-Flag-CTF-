<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Challenge;
use App\Models\ChallengeFlag;
use App\Services\FlagValidator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChallengeFlag>
 */
class ChallengeFlagFactory extends Factory
{
    protected static int $sequence = 0;

    public function definition(): array
    {
        self::$sequence++;
        $plaintext = 'CTF{factory-flag-'.self::$sequence.'-'.fake()->lexify('????').'}';

        return [
            'challenge_id' => Challenge::factory(),
            'flag_ciphertext' => FlagValidator::encrypt($plaintext),
            'flag_hash' => FlagValidator::hash($plaintext),
            'case_sensitive' => true,
            'is_active' => true,
        ];
    }

    /**
     * Attach a known plaintext flag to an existing challenge.
     *
     * @return array{model: ChallengeFlag, plaintext: string}
     */
    public static function withPlaintext(Challenge $challenge, ?string $plaintext = null): array
    {
        $plaintext ??= 'CTF{test-flag-'.fake()->lexify('????????').'}';

        $model = ChallengeFlag::forceCreate([
            'challenge_id' => $challenge->id,
            'flag_ciphertext' => FlagValidator::encrypt($plaintext),
            'flag_hash' => FlagValidator::hash($plaintext),
            'case_sensitive' => true,
            'is_active' => true,
        ]);

        return ['model' => $model, 'plaintext' => $plaintext];
    }
}
