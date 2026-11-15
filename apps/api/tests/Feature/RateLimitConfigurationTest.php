<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Rate-limit configuration (docs/security.md §4).
 *
 * AGENTS.md requires every limit to be driven by config/ctf.php, never
 * hardcoded. These tests prove the limiters actually read the config at
 * request time and that the throttles are wired to the auth routes.
 */
class RateLimitConfigurationTest extends TestCase
{
    public function test_the_register_limiter_is_driven_by_config(): void
    {
        config(['ctf.rate_limits.register_per_hour' => 2]);

        $payload = [
            'name' => 'Rate Limit',
            'email' => 'rate-limit@example.com',
            'password' => 'sup3r-secret-passw0rd',
            'password_confirmation' => 'sup3r-secret-passw0rd',
        ];

        $this->postJson('/api/v1/auth/register', $payload)->assertStatus(201);
        $this->postJson('/api/v1/auth/register', $payload)->assertStatus(422);
        $this->postJson('/api/v1/auth/register', $payload)->assertStatus(429);
    }

    public function test_the_password_reset_limiter_is_driven_by_config(): void
    {
        config(['ctf.rate_limits.password_reset_per_hour' => 2]);

        $payload = [
            'token' => 'bogus-reset-token',
            'email' => 'reset-me@example.com',
            'password' => 'sup3r-secret-passw0rd',
            'password_confirmation' => 'sup3r-secret-passw0rd',
        ];

        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(400);
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(400);
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertTooManyRequests();
    }

    public function test_every_rate_limit_key_the_provider_uses_exists_in_config(): void
    {
        $expected = [
            'auth_per_minute',
            'register_per_hour',
            'password_reset_per_hour',
            'submit_per_challenge_per_minute',
            'submit_per_user_per_minute',
            'download_per_minute',
            'admin_per_minute',
            'api_per_minute',
        ];

        foreach ($expected as $key) {
            $this->assertArrayHasKey($key, config('ctf.rate_limits'));
        }
    }
}
