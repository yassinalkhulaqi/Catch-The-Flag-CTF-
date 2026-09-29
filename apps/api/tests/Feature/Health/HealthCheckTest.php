<?php

declare(strict_types=1);

namespace Tests\Feature\Health;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_reports_db_and_storage(): void
    {
        Storage::fake('challenge-files');

        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.db', 'up')
            ->assertJsonPath('data.storage', 'up')
            ->assertJsonStructure(['data' => ['version', 'time']]);
    }
}
