<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paths', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->string('slug', 160)->unique();
            $table->string('summary', 400);
            $table->text('description')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->foreignId('category_id')->nullable()
                ->constrained('categories')->nullOnDelete();
            $table->string('difficulty', 20)->default('beginner');
            $table->unsignedInteger('estimated_minutes')->default(0);
            $table->string('status', 20)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
            $table->index('category_id');
            $table->index(['difficulty']);
        });

        DB::statement("ALTER TABLE paths ADD CONSTRAINT paths_status_check CHECK (status IN ('draft','review','published','archived'))");
        DB::statement("ALTER TABLE paths ADD CONSTRAINT paths_difficulty_check CHECK (difficulty IN ('beginner','intermediate','advanced','expert'))");
        DB::statement('ALTER TABLE paths ADD CONSTRAINT paths_minutes_check CHECK (estimated_minutes >= 0)');

        // full-text search — generated column, no triggers (ADR-0008)
        DB::statement("
            ALTER TABLE paths ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
                to_tsvector('simple',
                    coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, ''))
            ) STORED
        ");
        DB::statement('CREATE INDEX paths_search_idx ON paths USING GIN (search_vector)');

        Schema::create('path_prerequisites', function (Blueprint $table) {
            $table->foreignId('path_id')->constrained('paths')->cascadeOnDelete();
            $table->foreignId('prerequisite_path_id')->constrained('paths')->cascadeOnDelete();
            $table->primary(['path_id', 'prerequisite_path_id']);
            $table->index('prerequisite_path_id');
        });

        DB::statement('ALTER TABLE path_prerequisites ADD CONSTRAINT path_prereq_not_self CHECK (path_id <> prerequisite_path_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('path_prerequisites');
        Schema::dropIfExists('paths');
    }
};
