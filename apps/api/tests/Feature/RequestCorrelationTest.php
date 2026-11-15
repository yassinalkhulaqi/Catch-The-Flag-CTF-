<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\Context;
use Tests\TestCase;

/**
 * Request correlation (docs/architecture.md §7 Observability).
 *
 * The invariant under test: one id identifies one request, it is echoed on
 * every response, it is identical in the header and in the error body, and a
 * client can never choose a value that would corrupt a log line.
 */
class RequestCorrelationTest extends TestCase
{
    private const UUID_PATTERN = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/';

    public function test_successful_responses_carry_a_generated_request_id(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertHeader('X-Request-Id');

        $this->assertMatchesRegularExpression(
            self::UUID_PATTERN,
            (string) $response->headers->get('X-Request-Id'),
        );
    }

    public function test_a_well_formed_inbound_request_id_is_honoured(): void
    {
        $response = $this->withHeader('X-Request-Id', 'edge-abc.123:42')
            ->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertHeader('X-Request-Id', 'edge-abc.123:42');
    }

    public function test_a_hostile_inbound_request_id_is_replaced(): void
    {
        $response = $this->withHeader('X-Request-Id', 'not a valid id')
            ->getJson('/api/v1/health');

        $response->assertOk();

        $requestId = (string) $response->headers->get('X-Request-Id');

        $this->assertNotSame('not a valid id', $requestId);
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, $requestId);
    }

    public function test_an_overlong_inbound_request_id_is_replaced(): void
    {
        $response = $this->withHeader('X-Request-Id', str_repeat('a', 200))
            ->getJson('/api/v1/health');

        $response->assertOk();

        $requestId = (string) $response->headers->get('X-Request-Id');

        $this->assertNotSame(str_repeat('a', 200), $requestId);
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, $requestId);
    }

    public function test_error_responses_report_the_same_id_in_body_and_header(): void
    {
        $response = $this->withHeader('X-Request-Id', 'trace-42')
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(401);

        $this->assertSame('trace-42', $response->json('error.request_id'));
        $response->assertHeader('X-Request-Id', 'trace-42');
    }

    public function test_a_not_found_response_also_carries_the_id(): void
    {
        $response = $this->getJson('/api/v1/challenges/does-not-exist-at-all');

        $response->assertStatus(404);
        $response->assertHeader('X-Request-Id');
        $this->assertNotEmpty($response->json('error.request_id'));
    }

    public function test_the_request_id_is_bound_to_the_log_context(): void
    {
        $this->withHeader('X-Request-Id', 'log-ctx-1')
            ->getJson('/api/v1/health')
            ->assertOk();

        $this->assertTrue(Context::has('request_id'));
        $this->assertSame('log-ctx-1', Context::get('request_id'));
    }

    public function test_each_request_gets_its_own_id(): void
    {
        $first = $this->getJson('/api/v1/health');
        $second = $this->getJson('/api/v1/health');

        $this->assertNotSame(
            $first->headers->get('X-Request-Id'),
            $second->headers->get('X-Request-Id'),
        );
    }

    public function test_the_id_is_available_on_the_request_for_downstream_readers(): void
    {
        $captured = null;

        $this->app['router']->get('/api/v1/__request-id-probe', function () use (&$captured) {
            $captured = request()->attributes->get('request_id');

            return response()->json(['data' => ['status' => 'ok']]);
        });

        $response = $this->withHeader('X-Request-Id', 'downstream-1')
            ->getJson('/api/v1/__request-id-probe');

        $response->assertOk();

        $this->assertSame('downstream-1', $captured);
        $response->assertHeader('X-Request-Id', 'downstream-1');
    }
}
