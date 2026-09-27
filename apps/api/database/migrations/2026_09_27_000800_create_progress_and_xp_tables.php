<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_path_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('path_id')->constrained('paths')->cascadeOnDelete();
            $table->string('status', 20)->default('in_progress');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'path_id']);
        });

        DB::statement("ALTER TABLE user_path_progress ADD CONSTRAINT user_path_progress_status_check CHECK (status IN ('in_progress','completed'))");

        Schema::create('lesson_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->timestamp('completed_at')->useCurrent();

            $table->unique(['user_id', 'lesson_id']);
        });

        // append-only XP ledger — the only source of truth for balances (ADR-0007)
        Schema::create('xp_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('amount');
            $table->string('reason', 40);
            $table->string('reference_type', 80)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('note', 200)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index('reason');
        });

        DB::statement("
            ALTER TABLE xp_transactions ADD CONSTRAINT xp_reason_check CHECK (
                reason IN ('challenge_solve','quiz_pass','lesson_complete','path_complete','achievement','admin_adjustment')
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('xp_transactions');
        Schema::dropIfExists('lesson_completions');
        Schema::dropIfExists('user_path_progress');
    }
};
