<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Retention commands (docs/security.md §8).
 *
 * config/ctf.php declared a submission IP retention window with nothing
 * implementing it — the knob was decorative. These commands make it real,
 * and they must be safe to run repeatedly.
 */
class PruneCommandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_prune_submissions_anonymises_only_old_rows(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::factory()->create();

        $old = $this->submission($challenge, $user, now()->subDays(120), '203.0.113.7', 'EvilBot/1.0');
        $recent = $this->submission($challenge, $user, now()->subDays(5), '198.51.100.9', 'Mozilla/5.0');

        $this->artisan('ctf:prune-submissions')->assertSuccessful();

        $this->assertDatabaseHas('challenge_submissions', ['id' => $old->id, 'ip_address' => null, 'user_agent' => null]);
        $this->assertDatabaseHas('challenge_submissions', [
            'id' => $recent->id,
            'ip_address' => '198.51.100.9',
            'user_agent' => 'Mozilla/5.0',
        ]);
    }

    public function test_prune_submissions_is_idempotent(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::factory()->create();

        $this->submission($challenge, $user, now()->subDays(120), '203.0.113.7', 'EvilBot/1.0');

        $this->artisan('ctf:prune-submissions')->assertSuccessful();

        $this->artisan('ctf:prune-submissions')
            ->expectsOutputToContain('Anonymised 0 submission(s)')
            ->assertSuccessful();
    }

    public function test_prune_submissions_dry_run_changes_nothing(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::factory()->create();

        $old = $this->submission($challenge, $user, now()->subDays(120), '203.0.113.7', 'EvilBot/1.0');

        $this->artisan('ctf:prune-submissions', ['--dry-run' => true])->assertSuccessful();

        $this->assertDatabaseHas('challenge_submissions', [
            'id' => $old->id,
            'ip_address' => '203.0.113.7',
            'user_agent' => 'EvilBot/1.0',
        ]);
    }

    public function test_prune_submissions_rejects_a_negative_retention_window(): void
    {
        $this->artisan('ctf:prune-submissions', ['--days' => '-1'])->assertFailed();
    }

    public function test_prune_tokens_deletes_expired_tokens_and_keeps_valid_ones(): void
    {
        $user = User::factory()->create();

        $expired = $user->createToken('web', ['*'], now()->subDay());
        $valid = $user->createToken('web', ['*'], now()->addDay());

        $this->artisan('ctf:prune-tokens')->assertSuccessful();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $expired->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $valid->accessToken->id]);
    }

    public function test_prune_tokens_dry_run_keeps_everything(): void
    {
        $user = User::factory()->create();

        $expired = $user->createToken('web', ['*'], now()->subDay());

        $this->artisan('ctf:prune-tokens', ['--dry-run' => true])->assertSuccessful();

        $this->assertDatabaseHas('personal_access_tokens', ['id' => $expired->accessToken->id]);
    }

    /**
     * @param  Carbon  $createdAt
     */
    private function submission(Challenge $challenge, User $user, $createdAt, string $ip, string $userAgent): ChallengeSubmission
    {
        return ChallengeSubmission::forceCreate([
            'challenge_id' => $challenge->id,
            'user_id' => $user->id,
            'flag_hash' => str_repeat('a', 64),
            'is_correct' => false,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'created_at' => $createdAt,
        ]);
    }
}
