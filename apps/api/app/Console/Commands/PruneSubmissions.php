<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ChallengeSubmission;
use Illuminate\Console\Command;

/**
 * Anonymise the source data of old submissions (docs/security.md §8).
 *
 * The submission rows themselves are kept — they are the abuse-analysis and
 * integrity record — but the source IP and user agent stop being personal
 * data after the retention window configured in config/ctf.php. Idempotent:
 * rows already anonymised are not touched again.
 */
class PruneSubmissions extends Command
{
    /**
     * @var string
     */
    protected $signature = 'ctf:prune-submissions
                            {--dry-run : Report what would change without writing}
                            {--days= : Override ctf.submissions.ip_retention_days}';

    /**
     * @var string
     */
    protected $description = 'Anonymise IPs and user agents on submissions older than the retention window (docs/security.md §8)';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?? config('ctf.submissions.ip_retention_days', 90));

        if ($days < 0) {
            $this->error('The retention window must be zero days or more.');

            return self::FAILURE;
        }

        $cutoff = now()->subDays($days);

        $query = ChallengeSubmission::query()
            ->where('created_at', '<', $cutoff)
            ->where(function ($query): void {
                $query->whereNotNull('ip_address')->orWhereNotNull('user_agent');
            });

        $count = $query->count();

        if ($this->option('dry-run')) {
            $this->info("Dry run: {$count} submission(s) older than {$days} day(s) would be anonymised.");

            return self::SUCCESS;
        }

        $anonymised = $query->update([
            'ip_address' => null,
            'user_agent' => null,
        ]);

        $this->info("Anonymised {$anonymised} submission(s) older than {$days} day(s) (IP and user agent removed).");

        return self::SUCCESS;
    }
}
