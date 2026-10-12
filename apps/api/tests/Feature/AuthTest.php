<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Authenticate as a bearer token with a freshly-resolved guard.
     * Feature tests share one app instance per test, and Laravel caches
     * the resolved user on the guard — production boots fresh per
     * request, so forget first to assert real token state.
     */
    private function getMe(string $token): TestResponse
    {
        $this->app['auth']->forgetGuards();

        return $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$token}"]);
    }

    private function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Solver One',
            'email' => 'solver@example.com',
            'password' => 'correct-horse-battery-99',
            'password_confirmation' => 'correct-horse-battery-99',
        ], $overrides);
    }

    public function test_register_creates_user_and_returns_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->registerPayload());

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'solver@example.com')
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonPath('data.user.xp', 0)
            ->assertJsonStructure(['data' => ['user', 'token', 'expires_at']])
            ->assertJsonMissing(['password']);

        $this->assertDatabaseHas('users', ['email' => 'solver@example.com', 'role' => 'user']);
        $this->assertDatabaseMissing('users', ['email' => 'solver@example.com', 'password' => 'correct-horse-battery-99']);
    }

    public function test_register_ignores_privileged_mass_assignment(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'role' => 'admin',
            'xp' => 99999,
            'solved_count' => 42,
            'status' => 'published',
            'banned_at' => now()->toISOString(),
        ]));

        $response->assertCreated()->assertJsonPath('data.user.role', 'user');

        $this->assertDatabaseHas('users', [
            'email' => 'solver@example.com',
            'role' => 'user',
            'xp' => 0,
            'solved_count' => 0,
        ]);
    }

    public function test_register_rejects_duplicate_email_case_insensitively(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload())->assertCreated();

        $this->postJson('/api/v1/auth/register', $this->registerPayload(['email' => 'SOLVER@EXAMPLE.COM']))
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['request_id']]);
    }

    public function test_login_returns_token_for_valid_credentials(): void
    {
        User::factory()->create(['email' => 'solver@example.com']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'solver@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'solver@example.com')
            ->assertJsonStructure(['data' => ['user', 'token', 'expires_at']]);
    }

    public function test_login_errors_do_not_enumerate_users(): void
    {
        User::factory()->create(['email' => 'solver@example.com']);

        $wrongPassword = $this->postJson('/api/v1/auth/login', [
            'email' => 'solver@example.com',
            'password' => 'wrong-password-00',
        ]);

        $unknownEmail = $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'wrong-password-00',
        ]);

        $wrongPassword->assertStatus(422);
        $unknownEmail->assertStatus(422);
        $this->assertSame(
            $wrongPassword->json('error.message'),
            $unknownEmail->json('error.message')
        );
    }

    public function test_banned_user_cannot_login(): void
    {
        User::factory()->banned()->create(['email' => 'solver@example.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'solver@example.com',
            'password' => 'password',
        ])->assertForbidden()->assertJsonPath('error.code', 'account_banned');
    }

    public function test_banned_user_token_is_rejected_on_authenticated_routes(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;
        $user->forceFill(['banned_at' => now()])->save();

        $this->getMe($token)
            ->assertForbidden()
            ->assertJsonPath('error.code', 'account_banned');
    }

    public function test_me_returns_current_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        $this->getMe($token)
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonStructure(['data' => ['id', 'name', 'role', 'xp'], 'meta' => ['unread_notifications_count']]);
    }

    public function test_unauthenticated_me_returns_401_envelope(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'unauthenticated');
    }

    public function test_logout_revokes_only_current_token(): void
    {
        $user = User::factory()->create();
        $first = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;
        $second = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        $this->postJson('/api/v1/auth/logout', [], ['Authorization' => "Bearer {$first}"])->assertOk();

        $this->getMe($first)->assertUnauthorized();
        $this->getMe($second)->assertOk();
    }

    public function test_logout_all_revokes_every_token(): void
    {
        $user = User::factory()->create();
        $first = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;
        $second = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        $this->postJson('/api/v1/auth/logout-all', [], ['Authorization' => "Bearer {$first}"])->assertOk();

        $this->getMe($first)->assertUnauthorized();
        $this->getMe($second)->assertUnauthorized();
    }

    public function test_forgot_password_always_returns_202(): void
    {
        Notification::fake();

        User::factory()->create(['email' => 'solver@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'solver@example.com'])->assertAccepted();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'ghost@example.com'])->assertAccepted();

        Notification::assertSentTo(User::where('email', 'solver@example.com')->first(), ResetPassword::class);
    }

    public function test_reset_password_with_valid_token(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'solver@example.com']);
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'solver@example.com'])->assertAccepted();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'solver@example.com',
            'password' => 'brand-new-password-42',
            'password_confirmation' => 'brand-new-password-42',
        ])->assertOk()->assertJsonPath('data.reset', true);

        $this->assertTrue(Hash::check('brand-new-password-42', $user->refresh()->password));

        // Single-use: the same token is dead now.
        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'solver@example.com',
            'password' => 'another-password-43',
            'password_confirmation' => 'another-password-43',
        ])->assertBadRequest();
    }

    public function test_reset_password_rejects_invalid_token(): void
    {
        User::factory()->create(['email' => 'solver@example.com']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'bogus-token',
            'email' => 'solver@example.com',
            'password' => 'brand-new-password-42',
            'password_confirmation' => 'brand-new-password-42',
        ])->assertBadRequest()->assertJsonPath('error.code', 'bad_request');
    }

    public function test_profile_update_and_password_change(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;
        $other = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $this->putJson('/api/v1/profile', ['name' => 'New Name', 'bio' => 'DFIR enjoyer'], $headers)
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.bio', 'DFIR enjoyer');

        // Privileged fields are ignored, never applied.
        $this->putJson('/api/v1/profile', ['role' => 'admin', 'xp' => 5000], $headers)->assertOk();
        $this->assertSame('user', $user->refresh()->role->value);
        $this->assertSame(0, (int) $user->xp);

        $this->putJson('/api/v1/profile/password', [
            'current_password' => 'password',
            'password' => 'rotated-password-77',
            'password_confirmation' => 'rotated-password-77',
        ], $headers)->assertOk();

        // Current session survives; every other token is dead.
        $this->getMe($token)->assertOk();
        $this->getMe($other)->assertUnauthorized();
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'solver@example.com',
                'password' => 'wrong-password-00',
            ]);
        }

        $this->postJson('/api/v1/auth/login', [
            'email' => 'solver@example.com',
            'password' => 'wrong-password-00',
        ])->assertTooManyRequests()->assertJsonPath('error.code', 'rate_limited');
    }
}
