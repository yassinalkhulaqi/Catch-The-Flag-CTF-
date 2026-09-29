<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Defense-in-depth: prevent duplicate XP awards for the same
 * (user, reason, reference) when reference is present.
 * Admin adjustments (null reference) remain unrestricted.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('
            CREATE UNIQUE INDEX xp_transactions_user_reason_ref_unique
            ON xp_transactions (user_id, reason, reference_type, reference_id)
            WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL
        ');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS xp_transactions_user_reason_ref_unique');
    }
};
