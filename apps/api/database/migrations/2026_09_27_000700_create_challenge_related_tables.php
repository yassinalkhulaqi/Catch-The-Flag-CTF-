<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // --- flags: no plaintext, only ciphertext + keyed HMAC (ADR-0006) ---
        Schema::create('challenge_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->string('label', 80)->nullable();
            $table->text('flag_ciphertext');
            $table->char('flag_hash', 64);
            $table->boolean('case_sensitive')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['challenge_id', 'flag_hash']);
        });

        // --- hints ---
        Schema::create('challenge_hints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->text('content');
            $table->unsignedInteger('cost_points')->default(0);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['challenge_id', 'position']);
        });

        Schema::create('hint_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->foreignId('hint_id')->constrained('challenge_hints')->cascadeOnDelete();
            $table->unsignedInteger('points_cost')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_id', 'hint_id']);
            $table->index(['user_id', 'challenge_id']);
        });

        // --- files: server-generated keys, never client paths (security.md §6) ---
        Schema::create('challenge_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->string('original_name', 255);
            $table->string('storage_disk', 40)->default('challenge-files');
            $table->string('storage_key', 255)->unique();
            $table->string('mime_type', 120);
            $table->bigInteger('size_bytes');
            $table->char('checksum_sha256', 64);
            $table->string('visibility', 20)->default('private');
            $table->timestamps();
            $table->softDeletes();

            $table->index('challenge_id');
        });

        DB::statement('ALTER TABLE challenge_files ADD CONSTRAINT challenge_files_size_check CHECK (size_bytes > 0)');
        DB::statement("ALTER TABLE challenge_files ADD CONSTRAINT challenge_files_visibility_check CHECK (visibility IN ('private','authenticated'))");

        // --- submissions: immutable attempt log, HMAC only (never plaintext) ---
        Schema::create('challenge_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->char('flag_hash', 64);
            $table->boolean('is_correct')->default(false);
            $table->inet('ip_address')->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['challenge_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'challenge_id', 'is_correct']);
        });

        // --- solves: DB-level duplicate guard ---
        Schema::create('challenge_solves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained('challenges')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('points_awarded');
            $table->unsignedInteger('hints_used')->default(0);
            $table->timestamp('solved_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['challenge_id', 'user_id']);
            $table->index(['user_id', 'solved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challenge_solves');
        Schema::dropIfExists('challenge_submissions');
        Schema::dropIfExists('challenge_files');
        Schema::dropIfExists('hint_unlocks');
        Schema::dropIfExists('challenge_hints');
        Schema::dropIfExists('challenge_flags');
    }
};
