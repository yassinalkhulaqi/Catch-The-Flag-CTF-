<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

final class AuditLogger
{
    private const REDACT_KEYS = [
        'password',
        'password_confirmation',
        'token',
        'flag',
        'flag_value',
        'value',
        'flag_ciphertext',
        'flag_hash',
        'current_password',
        'remember_token',
    ];

    public function log(?User $actor, string $action, Model|string $auditable, ?array $changes = null): AuditLog
    {
        if (is_string($auditable)) {
            $type = $auditable;
            $id = null;
        } else {
            $type = strtolower(class_basename($auditable));
            $id = $auditable->getKey();
        }

        return AuditLog::query()->create([
            'actor_id' => $actor?->id,
            'action' => $action,
            'auditable_type' => $type,
            'auditable_id' => $id,
            'changes' => $changes === null ? null : $this->redact($changes),
            'ip_address' => Request::ip(),
            'user_agent' => substr((string) Request::userAgent(), 0, 255) ?: null,
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function redact(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            $keyStr = (string) $key;
            if ($this->shouldRedact($keyStr)) {
                $out[$keyStr] = '***';

                continue;
            }
            if (is_array($value)) {
                $out[$keyStr] = $this->redact($value);

                continue;
            }
            $out[$keyStr] = $value;
        }

        return $out;
    }

    private function shouldRedact(string $key): bool
    {
        $normalized = strtolower($key);

        if (in_array($normalized, ['flag_validation_type', 'flag_format'], true)) {
            return false;
        }

        foreach (self::REDACT_KEYS as $secret) {
            if ($normalized === $secret || str_ends_with($normalized, '_'.$secret) || str_starts_with($normalized, $secret.'_')) {
                return true;
            }
            if ($secret === 'flag' && ($normalized === 'flag' || str_contains($normalized, 'flag_'))) {
                return true;
            }
            if ($secret === 'value' && $normalized === 'value') {
                return true;
            }
        }

        return false;
    }
}
