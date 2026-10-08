<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Replace the "type key exists" check with the criteria shape AchievementService
 * actually evaluates: known type, integer threshold, and category_id for
 * category_solves. Category existence stays in form-request validation because
 * a CHECK cannot follow deletes on categories.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_criteria_type_check');
        DB::statement(<<<'SQL'
            ALTER TABLE achievements ADD CONSTRAINT achievements_criteria_type_check CHECK (
                criteria IS NULL
                OR (
                    COALESCE((criteria->>'type') IN (
                        'solves_total',
                        'xp_total',
                        'paths_completed',
                        'category_solves',
                        'first_blood'
                    ), false)
                    AND COALESCE(jsonb_typeof(criteria->'threshold') = 'number', false)
                    AND CASE
                        WHEN jsonb_typeof(criteria->'threshold') = 'number' THEN
                            (criteria->>'threshold')::numeric >= 1
                            AND (criteria->>'threshold')::numeric <= 1000000
                            AND (criteria->>'threshold')::numeric = trunc((criteria->>'threshold')::numeric)
                        ELSE false
                    END
                    AND (
                        COALESCE((criteria->>'type') <> 'category_solves', false)
                        OR (
                            COALESCE(jsonb_typeof(criteria->'category_id') = 'number', false)
                            AND CASE
                                WHEN jsonb_typeof(criteria->'category_id') = 'number' THEN
                                    (criteria->>'category_id')::numeric >= 1
                                    AND (criteria->>'category_id')::numeric = trunc((criteria->>'category_id')::numeric)
                                ELSE false
                            END
                        )
                    )
                )
            )
        SQL);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_criteria_type_check');
        DB::statement("
            ALTER TABLE achievements ADD CONSTRAINT achievements_criteria_type_check CHECK (
                criteria IS NULL OR jsonb_exists(criteria, 'type')
            )
        ");
    }
};
