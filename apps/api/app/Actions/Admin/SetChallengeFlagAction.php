<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Challenge;
use App\Models\ChallengeFlag;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\FlagValidator;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Write-only flag authoring (docs/security.md §5). Plaintext is
 * encrypted (AES-GCM) + hashed (HMAC) and never stored, logged, or
 * returned — the audit diff carries metadata only, and AuditLogger
 * redacts any `flag*` key as a second layer.
 *
 * One row per label: storing under an existing label replaces its
 * material; a null label always creates a new row. On update the
 * value may be omitted to toggle state only — but changing
 * case_sensitive without a new value is 422 (the hash cannot be
 * recomputed without plaintext).
 */
class SetChallengeFlagAction
{
    /**
     * @param  string|null  $plaintext  Null keeps existing material (update only).
     */
    public function execute(
        User $actor,
        Challenge $challenge,
        ?string $plaintext,
        ?string $label,
        bool $caseSensitive,
        bool $isActive,
        Request $request,
    ): ChallengeFlag {
        return DB::transaction(function () use ($actor, $challenge, $plaintext, $label, $caseSensitive, $isActive, $request): ChallengeFlag {
            $existing = $label !== null
                ? $challenge->flags()->where('label', $label)->first()
                : null;

            if ($existing === null && $plaintext === null) {
                throw new HttpException(422, 'A flag value is required to create a flag.');
            }

            if ($existing !== null && $plaintext === null && $existing->case_sensitive !== $caseSensitive) {
                throw new HttpException(422, 'Provide the flag value when changing case sensitivity.');
            }

            $before = $existing?->only(['label', 'case_sensitive', 'is_active']);

            $attributes = [
                'label' => $label,
                'case_sensitive' => $caseSensitive,
                'is_active' => $isActive,
            ];

            if ($plaintext !== null) {
                $attributes['flag_ciphertext'] = FlagValidator::encrypt($plaintext);
                $attributes['flag_hash'] = FlagValidator::hash($plaintext, $caseSensitive);
            }

            try {
                if ($existing === null) {
                    $flag = new ChallengeFlag;
                    $flag->forceFill(array_merge(['challenge_id' => $challenge->id], $attributes));
                    $flag->save();
                    $auditAction = 'challenge_flag.created';
                } else {
                    $flag = $existing;
                    $flag->forceFill($attributes);
                    $flag->save();
                    $auditAction = 'challenge_flag.updated';
                }
            } catch (QueryException $e) {
                if ($this->isUniqueViolation($e)) {
                    throw new HttpException(409, 'A different flag with the same value already exists on this challenge.');
                }

                throw $e;
            }

            AuditLogger::log(
                $actor,
                $auditAction,
                ChallengeFlag::class,
                $flag->id,
                ['before' => $before, 'after' => $flag->only(['label', 'case_sensitive', 'is_active'])],
                $request,
            );

            return $flag->refresh();
        });
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        $code = $e->getCode();

        if ($code === '23505' || $code === 23000) {
            return true;
        }

        $previous = $e->getPrevious();

        return $previous !== null && (string) $previous->getCode() === '23505';
    }
}
