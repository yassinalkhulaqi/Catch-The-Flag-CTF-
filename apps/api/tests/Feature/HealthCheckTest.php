<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Health probes (docs/architecture.md §7 Observability).
 *
 * Liveness must be cheap and unconditional. Readiness must tell an operator
 * which dependency is broken — and must not tell anyone else anything.
 */
class HealthCheckTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('challenge-files');
    }

    public function test_the_liveness_probe_reports_ok(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertJsonPath('data.status', 'ok');
        $response->assertJsonPath('data.version', config('app.version'));
    }

    public function test_the_live_alias_reports_the_same_as_the_status_route(): void
    {
        $this->getJson('/api/v1/health/live')
            ->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.version', config('app.version'));
    }

    public function test_the_readiness_probe_reports_every_dependency(): void
    {
        $response = $this->getJson('/api/v1/health/ready');

        $response->assertOk();
        $response->assertJsonPath('data.status', 'ok');

        $checks = $response->json('data.checks');

        $this->assertIsArray($checks);
        $this->assertSame(['database', 'cache', 'storage'], array_keys($checks));

        foreach ($checks as $name => $check) {
            $this->assertSame('ok', $check['status'], "Dependency [{$name}] should be healthy.");
            $this->assertIsNumeric($check['latency_ms']);
            $this->assertGreaterThanOrEqual(0, $check['latency_ms']);
        }
    }

    public function test_the_readiness_probe_fails_when_a_dependency_is_down(): void
    {
        Cache::partialMock()->shouldReceive('put')->andReturn(false);

        $response = $this->getJson('/api/v1/health/ready');

        $response->assertStatus(503);
        $response->assertJsonPath('data.status', 'degraded');
        $response->assertJsonPath('data.checks.cache.status', 'failed');
        $response->assertJsonPath('data.checks.database.status', 'ok');
    }

    public function test_the_readiness_probe_never_leaks_configuration(): void
    {
        $body = (string) $this->getJson('/api/v1/health/ready')->getContent();

        foreach (['password', 'secret', 'pgsql', 'postgres', 'storage/app', 'APP_KEY', '127.0.0.1'] as $needle) {
            $this->assertStringNotContainsStringIgnoringCase($needle, $body);
        }
    }

    public function test_the_health_probes_need_no_authentication(): void
    {
        $this->getJson('/api/v1/health')->assertOk();
        $this->getJson('/api/v1/health/live')->assertOk();
        $this->getJson('/api/v1/health/ready')->assertOk();
    }
}
