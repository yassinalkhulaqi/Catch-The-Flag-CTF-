<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Monolog\Formatter\JsonFormatter;
use Tests\TestCase;

/**
 * Structured logging (docs/architecture.md §7 Observability).
 *
 * The structured channel is what a log shipper reads. It has to emit one
 * parseable JSON object per line, and it has to carry the request id so a log
 * line and a user-reported failure can be matched.
 */
class StructuredLoggingTest extends TestCase
{
    private string $logPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->logPath = storage_path('framework/testing/structured-'.uniqid().'.log');

        File::ensureDirectoryExists(dirname($this->logPath));
    }

    protected function tearDown(): void
    {
        File::delete($this->logPath);

        parent::tearDown();
    }

    public function test_the_structured_channel_is_configured_for_machine_readable_output(): void
    {
        $channel = config('logging.channels.structured');

        $this->assertSame('monolog', $channel['driver']);
        $this->assertSame(JsonFormatter::class, $channel['formatter']);
        $this->assertSame(JsonFormatter::BATCH_MODE_JSON, $channel['formatter_with']['batchMode']);
        $this->assertTrue($channel['formatter_with']['appendNewline']);
    }

    public function test_the_structured_channel_writes_one_json_object_per_line(): void
    {
        config(['logging.channels.structured.handler_with.stream' => $this->logPath]);

        Log::channel('structured')->info('observability probe', ['probe' => true]);

        $lines = $this->writtenLines();

        $this->assertCount(1, $lines);

        $decoded = json_decode($lines[0], true);

        $this->assertIsArray($decoded);
        $this->assertSame('observability probe', $decoded['message']);
        $this->assertSame('INFO', $decoded['level_name']);
        $this->assertTrue($decoded['context']['probe']);
    }

    public function test_a_structured_log_line_carries_the_request_id(): void
    {
        config([
            'logging.default' => 'structured',
            'logging.channels.structured.handler_with.stream' => $this->logPath,
        ]);

        $this->withHeader('X-Request-Id', 'structured-1')
            ->getJson('/api/v1/health')
            ->assertOk();

        Log::info('observability probe');

        $lines = $this->writtenLines();

        $this->assertNotEmpty($lines);

        $decoded = json_decode($lines[count($lines) - 1], true);

        $this->assertIsArray($decoded);
        $this->assertSame('structured-1', $decoded['extra']['request_id']);
    }

    public function test_an_unhandled_exception_is_logged_with_the_route_that_failed(): void
    {
        config([
            'logging.default' => 'structured',
            'logging.channels.structured.handler_with.stream' => $this->logPath,
        ]);

        $this->app['router']->get('/api/v1/__boom', function (): void {
            throw new \RuntimeException('boom');
        });

        $response = $this->getJson('/api/v1/__boom');

        $response->assertStatus(500);
        $response->assertHeader('X-Request-Id');
        $this->assertSame('server_error', $response->json('error.code'));

        $logged = $this->recordsFor('RuntimeException');

        $this->assertNotEmpty($logged);
        $this->assertSame('GET', $logged[0]['context']['method']);
        $this->assertStringContainsString('__boom', $logged[0]['context']['path']);
        $this->assertArrayHasKey('request_id', $logged[0]['extra']);
    }

    /**
     * Decoded records of the structured log file that carry the given
     * exception class in their context.
     *
     * @return array<int, array<string, mixed>>
     */
    private function recordsFor(string $exceptionClass): array
    {
        $records = [];

        foreach ($this->writtenLines() as $line) {
            $decoded = json_decode($line, true);

            if (is_array($decoded) && ($decoded['context']['exception'] ?? null) === $exceptionClass) {
                $records[] = $decoded;
            }
        }

        return $records;
    }

    /**
     * @return array<int, string>
     */
    private function writtenLines(): array
    {
        if (! File::exists($this->logPath)) {
            return [];
        }

        $contents = (string) file_get_contents($this->logPath);

        return array_values(array_filter(
            explode("\n", $contents),
            static fn (string $line): bool => trim($line) !== '',
        ));
    }
}
