<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Append-only audit trail writer (docs/database.md §9).
 *
 * Every admin mutation funnels through here with a before/after diff.
 * Secrets are redacted as a second layer of defense: any array key
 * containing `flag`, `password`, or `token` (case-insensitive, at any
 * nesting depth) is stored as `***`. Callers must still never pass
 * plaintext flags — redaction only limits blast radius on mistakes.
 */
class AuditLogger
{
    /** @var list<string> */
    private const SENSITIVE_FRAGMENTS = ['flag', 'password', 'token'];

    public static function log(
        User $actor,
        string $action,
        string $auditableType,
        ?int $auditableId,
        ?array $changes,
        Request $request,
    ): AuditLog {
        return AuditLog::forceCreate([
            'actor_id' => $actor->id,
            'action' => substr($action, 0, 80),
            'auditable_type' => substr($auditableType, 0, 80),
            'auditable_id' => $auditableId,
            'changes' => self::redact($changes),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent() !== null ? substr($request->userAgent(), 0, 255) : null,
        ]);
    }

    /**
     * Recursively replace values under sensitive keys with `***`.
     *
     * @return array<string, mixed>|null
     */
    public static function redact(?array $changes): ?array
    {
        if ($changes === null) {
            return null;
        }

        $redacted = [];

        foreach ($changes as $key => $value) {
            if (is_string($key) && self::isSensitive($key)) {
                $redacted[$key] = '***';
            } elseif (is_array($value)) {
                $redacted[$key] = self::redact($value);
            } else {
                $redacted[$key] = $value;
            }
        }

        return $redacted;
    }

    private static function isSensitive(string $key): bool
    {
        $lower = strtolower($key);

        foreach (self::SENSITIVE_FRAGMENTS as $fragment) {
            if (str_contains($lower, $fragment)) {
                return true;
            }
        }

        return false;
    }
}
