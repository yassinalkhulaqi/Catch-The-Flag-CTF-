<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Delete personal access tokens that can no longer be used (docs/architecture.md §7).
 *
 * Expired tokens are rejected at authentication time anyway; removing them
 * keeps the table small and drops stale metadata. Tokens without an expiry
 * are left alone — they are the ones a deployment created before the TTL
 * policy existed and must not be silently wiped.
 */
class PruneExpiredTokens extends Command
{
    /**
     * @var string
     */
    protected $signature = 'ctf:prune-tokens
                            {--dry-run : Report what would change without writing}
                            {--grace-days=1 : Only delete tokens that expired at least this many days ago}';

    /**
     * @var string
     */
    protected $description = 'Delete expired personal access tokens';

    public function handle(): int
    {
        $graceDays = (int) $this->option('grace-days');

        if ($graceDays < 0) {
            $this->error('The grace period must be zero days or more.');

            return self::FAILURE;
        }

        $cutoff = now()->subDays($graceDays);

        $query = PersonalAccessToken::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', $cutoff);

        $count = $query->count();

        if ($this->option('dry-run')) {
            $this->info("Dry run: {$count} expired token(s) would be deleted.");

            return self::SUCCESS;
        }

        $deleted = $query->delete();

        $this->info("Deleted {$deleted} expired token(s) (grace period: {$graceDays} day(s)).");

        return self::SUCCESS;
    }
}
