<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * docs/database.md §5 specifies selected_option_ids as int[]; the
     * original migration's ->isArray() was a no-op leaving a plain
     * integer column. Promote it, preserving existing values.
     */
    public function up(): void
    {
        DB::statement('
            ALTER TABLE quiz_attempt_answers
            ALTER COLUMN selected_option_ids TYPE integer[]
            USING ARRAY[selected_option_ids]
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('
            ALTER TABLE quiz_attempt_answers
            ALTER COLUMN selected_option_ids TYPE integer
            USING COALESCE(selected_option_ids[1], 0)
        ');
    }
};
