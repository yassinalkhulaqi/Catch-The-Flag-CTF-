<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesChallengeWithFlag;
use Tests\TestCase;

class UploadValidationTest extends TestCase
{
    use CreatesChallengeWithFlag;
    use RefreshDatabase;

    public function test_disallowed_mime_returns_validation_error_not_500(): void
    {
        Storage::fake('challenge-files');
        // Restrict allowlist so plain text (what finfo detects for this upload) is rejected.
        config(['ctf.uploads.allowed_mime_types' => ['image/png']]);

        $admin = User::factory()->admin()->create();
        $challenge = $this->makePublishedChallenge();

        $upload = UploadedFile::fake()->createWithContent('note.txt', "not an image\n");

        $response = $this->actingAsApi($admin)->post(
            "/api/v1/admin/challenges/{$challenge->id}/files",
            ['file' => $upload],
        );

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['fields' => ['file'], 'request_id']]);
        $this->assertSame(0, $challenge->files()->count());
    }
}
