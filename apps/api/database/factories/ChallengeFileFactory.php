<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Challenge;
use App\Models\ChallengeFile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChallengeFile>
 */
class ChallengeFileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'challenge_id' => Challenge::factory(),
            'original_name' => 'evidence.txt',
            'storage_disk' => 'challenge-files',
            'storage_key' => 'challenges/0/'.fake()->uuid().'.txt',
            'mime_type' => 'text/plain',
            'size_bytes' => 12,
            'checksum_sha256' => hash('sha256', 'factory'),
            'visibility' => 'private',
        ];
    }
}
