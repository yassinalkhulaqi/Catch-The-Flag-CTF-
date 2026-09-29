<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_logout_flow(): void
    {
        $register = $this->postJson('/api/v1/auth/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'SecurePassw0rd!',
            'password_confirmation' => 'SecurePassw0rd!',
        ]);

        $register->assertCreated()
            ->assertJsonPath('data.user.email', 'alice@example.com')
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonStructure(['data' => ['token', 'expires_at', 'user' => ['id', 'xp', 'solved_count']]]);

        $this->assertDatabaseMissing('users', ['email' => 'alice@example.com', 'role' => 'admin']);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'alice@example.com',
            'password' => 'SecurePassw0rd!',
        ]);
        $login->assertOk()->assertJsonStructure(['data' => ['token', 'user']]);
        $token = $login->json('data.token');

        $me = $this->getJson('/api/v1/auth/me', ['Authorization' => 'Bearer '.$token]);
        $me->assertOk()->assertJsonPath('data.email', 'alice@example.com');

        $logout = $this->postJson('/api/v1/auth/logout', [], ['Authorization' => 'Bearer '.$token]);
        $logout->assertOk();

        Auth::forgetGuards();

        $this->getJson('/api/v1/auth/me', ['Authorization' => 'Bearer '.$token])->assertUnauthorized();
    }

    public function test_mass_assignment_cannot_set_role_or_xp_on_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Eve',
            'email' => 'eve@example.com',
            'password' => 'SecurePassw0rd!',
            'password_confirmation' => 'SecurePassw0rd!',
            'role' => 'admin',
            'xp' => 99999,
            'solved_count' => 50,
        ]);

        $response->assertCreated();
        $user = User::query()->where('email', 'eve@example.com')->firstOrFail();
        $this->assertSame('user', $user->role->value);
        $this->assertSame(0, (int) $user->xp);
        $this->assertSame(0, (int) $user->solved_count);
    }
}
