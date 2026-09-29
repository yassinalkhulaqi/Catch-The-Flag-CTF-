<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Challenge;
use App\Models\ChallengeFlag;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\FlagCryptoService;
use Illuminate\Support\Facades\DB;

final class SetChallengeFlagAction
{
    public function __construct(
        private FlagCryptoService $crypto,
        private AuditLogger $audit,
    ) {}

    /**
     * @param  array{value:string,label?:?string,case_sensitive?:bool,is_active?:bool}  $data
     */
    public function handle(User $actor, Challenge $challenge, array $data, ?ChallengeFlag $existing = null): ChallengeFlag
    {
        return DB::transaction(function () use ($actor, $challenge, $data, $existing): ChallengeFlag {
            $caseSensitive = (bool) ($data['case_sensitive'] ?? true);
            $normalized = $this->crypto->normalize($data['value'], $caseSensitive);
            $hash = $this->crypto->hmacHash($normalized);
            $ciphertext = $this->crypto->encrypt($data['value']);

            if ($existing !== null) {
                $existing->forceFill([
                    'label' => $data['label'] ?? $existing->label,
                    'flag_ciphertext' => $ciphertext,
                    'flag_hash' => $hash,
                    'case_sensitive' => $caseSensitive,
                    'is_active' => $data['is_active'] ?? $existing->is_active,
                ])->save();

                $this->audit->log($actor, 'flag.update', $challenge, [
                    'flag_id' => $existing->id,
                    'value' => $data['value'],
                ]);

                return $existing->refresh();
            }

            $flag = new ChallengeFlag;
            $flag->forceFill([
                'challenge_id' => $challenge->id,
                'label' => $data['label'] ?? null,
                'flag_ciphertext' => $ciphertext,
                'flag_hash' => $hash,
                'case_sensitive' => $caseSensitive,
                'is_active' => $data['is_active'] ?? true,
            ])->save();

            $this->audit->log($actor, 'flag.create', $challenge, [
                'flag_id' => $flag->id,
                'value' => $data['value'],
            ]);

            return $flag;
        });
    }
}
