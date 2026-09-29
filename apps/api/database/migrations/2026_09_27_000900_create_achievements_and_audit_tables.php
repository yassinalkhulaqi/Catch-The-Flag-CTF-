<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('title', 160);
            $table->string('description', 400);
            $table->string('icon', 60)->nullable();
            // criteria is config, not relational data (ADR-0006 note in database.md)
            $table->jsonb('criteria')->nullable();
            $table->unsignedInteger('points')->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        DB::statement("
            ALTER TABLE achievements ADD CONSTRAINT achievements_criteria_type_check CHECK (
                criteria IS NULL OR jsonb_exists(criteria, 'type')
            )
        ");

        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('achievement_id')->constrained('achievements')->cascadeOnDelete();
            $table->timestamp('awarded_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_id', 'achievement_id']);
        });

        // append-only security trail (docs/database.md §9)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('action', 80);
            $table->string('auditable_type', 80);
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->jsonb('changes')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['created_at']);
            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['actor_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievements');
    }
};
