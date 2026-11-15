<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Dependency probes for the readiness endpoint (docs/architecture.md §7).
 *
 * The probes answer one question per dependency: "can this instance still do
 * its job?". They deliberately report nothing but a coarse status and a
 * duration — no hostnames, no paths, no versions, no exception messages — so
 * the endpoint can stay reachable by an orchestrator without becoming an
 * information leak.
 */
final class HealthCheckService
{
    /**
     * Run every probe.
     *
     * @return array<string, array{status: string, latency_ms: float}>
     */
    public function checks(): array
    {
        return [
            'database' => $this->probe(fn (): bool => $this->databaseIsReachable()),
            'cache' => $this->probe(fn (): bool => $this->cacheIsUsable()),
            'storage' => $this->probe(fn (): bool => $this->storageIsWritable()),
        ];
    }

    /**
     * The instance is ready when no dependency failed.
     *
     * @param  array<string, array{status: string, latency_ms: float}>|null  $checks
     */
    public function isReady(?array $checks = null): bool
    {
        $checks ??= $this->checks();

        foreach ($checks as $check) {
            if ($check['status'] !== 'ok') {
                return false;
            }
        }

        return true;
    }

    /**
     * Run one probe and describe its outcome.
     *
     * @param  callable(): bool  $probe
     * @return array{status: string, latency_ms: float}
     */
    private function probe(callable $probe): array
    {
        $startedAt = hrtime(true);

        try {
            $healthy = $probe();
        } catch (Throwable) {
            $healthy = false;
        }

        return [
            'status' => $healthy ? 'ok' : 'failed',
            'latency_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
        ];
    }

    /**
     * The database has to answer a trivial query.
     */
    private function databaseIsReachable(): bool
    {
        DB::connection()->select('select 1');

        return true;
    }

    /**
     * The cache has to accept a write and read it back: a read-only cache
     * would pass a naive probe and still break rate limiting.
     */
    private function cacheIsUsable(): bool
    {
        $key = 'health-check-'.Str::uuid()->toString();

        if (! Cache::put($key, 'ok', 10)) {
            return false;
        }

        $value = Cache::get($key);

        Cache::forget($key);

        return $value === 'ok';
    }

    /**
     * The private challenge-artifact disk has to accept a write. The platform
     * cannot accept a challenge without it, so a read-only probe would be
     * misleading.
     */
    private function storageIsWritable(): bool
    {
        $disk = Storage::disk(ChallengeFileService::DISK);
        $key = 'health/'.Str::uuid()->toString().'.probe';

        if (! $disk->put($key, '')) {
            return false;
        }

        $disk->delete($key);

        return true;
    }
}
