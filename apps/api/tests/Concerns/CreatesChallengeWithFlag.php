<?php

declare(strict_types=1);

namespace Tests\Concerns;

use App\Actions\SetChallengeFlagAction;
use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

trait CreatesChallengeWithFlag
{
    protected function makePublishedChallenge(string $flag = 'CTF{test_flag}', array $overrides = []): Challenge
    {
        $category = Category::factory()->create();
        $challenge = Challenge::factory()->published()->create(array_merge([
            'category_id' => $category->id,
            'points' => 100,
        ], $overrides));

        $actor = User::factory()->admin()->create();
        app(SetChallengeFlagAction::class)->handle($actor, $challenge, [
            'value' => $flag,
            'label' => 'primary',
            'case_sensitive' => true,
        ]);

        return $challenge->fresh();
    }

    protected function attachTextFile(Challenge $challenge, string $contents = 'hello', string $name = 'sample.txt'): ChallengeFile
    {
        Storage::fake('challenge-files');
        $key = Str::uuid()->toString().'/'.Str::uuid()->toString().'.txt';
        Storage::disk('challenge-files')->put($key, $contents);

        return ChallengeFile::query()->create([
            'challenge_id' => $challenge->id,
            'original_name' => $name,
            'storage_disk' => 'challenge-files',
            'storage_key' => $key,
            'mime_type' => 'text/plain',
            'size_bytes' => strlen($contents),
            'checksum_sha256' => hash('sha256', $contents),
            'visibility' => 'authenticated',
        ]);
    }

    protected function actingAsApi(User $user): static
    {
        Auth::forgetGuards();
        Sanctum::actingAs($user);

        return $this;
    }

    /** @deprecated prefer actingAsApi */
    protected function authHeaders(User $user): array
    {
        Auth::forgetGuards();
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => 'Bearer '.$token];
    }
}
