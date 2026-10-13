<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileDownloadTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{Challenge, ChallengeFile, array<string, string>} */
    private function makeFixture(string $status = 'published'): array
    {
        Storage::fake('challenge-files');

        $user = User::factory()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $challenge = Challenge::factory()->create(['status' => $status, 'published_at' => $status === 'published' ? now() : null]);
        $file = ChallengeFile::factory()->for($challenge)->create([
            'original_name' => 'evidence.pcap',
            'storage_key' => "challenges/{$challenge->id}/evidence.bin",
            'mime_type' => 'application/vnd.tcpdump.pcap',
            'size_bytes' => 9,
        ]);
        Storage::disk('challenge-files')->put($file->storage_key, 'pcap-data');

        return [$challenge, $file, $headers];
    }

    public function test_published_file_downloads_as_attachment(): void
    {
        [$challenge, $file, $headers] = $this->makeFixture();

        $response = $this->get(
            "/api/v1/challenges/{$challenge->id}/files/{$file->id}/download",
            $headers
        );

        $response->assertOk();
        $this->assertSame('application/octet-stream', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition', ''));
        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame('pcap-data', $response->streamedContent());
    }

    public function test_draft_file_is_hidden_from_players(): void
    {
        [$challenge, $file, $headers] = $this->makeFixture('draft');

        $this->get("/api/v1/challenges/{$challenge->id}/files/{$file->id}/download", $headers)
            ->assertNotFound();
    }

    public function test_staff_can_download_draft_files(): void
    {
        Storage::fake('challenge-files');

        $admin = User::factory()->admin()->create();
        $headers = ['Authorization' => 'Bearer '.$admin->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $challenge = Challenge::factory()->draft()->create();
        $file = ChallengeFile::factory()->for($challenge)->create([
            'storage_key' => "challenges/{$challenge->id}/staff.bin",
        ]);
        Storage::disk('challenge-files')->put($file->storage_key, 'staff-data');

        $this->get("/api/v1/challenges/{$challenge->id}/files/{$file->id}/download", $headers)->assertOk();
    }

    public function test_unknown_file_is_404(): void
    {
        [$challenge, , $headers] = $this->makeFixture();

        $this->get("/api/v1/challenges/{$challenge->id}/files/999999/download", $headers)
            ->assertNotFound();
    }

    public function test_traversal_style_file_id_is_rejected(): void
    {
        [$challenge, , $headers] = $this->makeFixture();

        $this->get("/api/v1/challenges/{$challenge->id}/files/../{$challenge->id}/download", $headers)
            ->assertNotFound();
    }
}
