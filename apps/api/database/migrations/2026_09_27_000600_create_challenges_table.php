<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->string('slug', 160)->unique();
            $table->text('description');
            $table->text('scenario')->nullable();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('difficulty', 20)->default('beginner');
            $table->unsignedInteger('points')->default(100);
            $table->unsignedInteger('estimated_minutes')->default(30);
            $table->string('status', 20)->default('draft');
            // extension point: only 'static' implemented in V1 (ADR-0006)
            $table->string('flag_validation_type', 20)->default('static');
            $table->foreignId('author_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('solve_count')->default(0);
            $table->unsignedInteger('max_attempts')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('category_id');
            $table->index('difficulty');
            $table->index(['status', 'published_at']);
            $table->index('points');
        });

        DB::statement("ALTER TABLE challenges ADD CONSTRAINT challenges_status_check CHECK (status IN ('draft','review','published','archived'))");
        DB::statement("ALTER TABLE challenges ADD CONSTRAINT challenges_difficulty_check CHECK (difficulty IN ('beginner','intermediate','advanced','expert'))");
        DB::statement("ALTER TABLE challenges ADD CONSTRAINT challenges_flag_type_check CHECK (flag_validation_type IN ('static','per_user','per_instance','dynamic'))");
        DB::statement('ALTER TABLE challenges ADD CONSTRAINT challenges_points_check CHECK (points BETWEEN 1 AND 10000)');
        DB::statement('ALTER TABLE challenges ADD CONSTRAINT challenges_solve_count_check CHECK (solve_count >= 0)');

        DB::statement("
            ALTER TABLE challenges ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
                to_tsvector('simple',
                    coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(scenario, ''))
            ) STORED
        ");
        DB::statement('CREATE INDEX challenges_search_idx ON challenges USING GIN (search_vector)');

        // a challenge may be linked to 0..n lessons and exist standalone (spec §9)
        Schema::create('lesson_challenge', function (Blueprint $table) {
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->primary(['lesson_id', 'challenge_id']);
            $table->index('challenge_id');
        });

        Schema::create('challenge_tag', function (Blueprint $table) {
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained('tags')->cascadeOnDelete();
            $table->primary(['challenge_id', 'tag_id']);
            $table->index('tag_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challenge_tag');
        Schema::dropIfExists('lesson_challenge');
        Schema::dropIfExists('challenges');
    }
};
