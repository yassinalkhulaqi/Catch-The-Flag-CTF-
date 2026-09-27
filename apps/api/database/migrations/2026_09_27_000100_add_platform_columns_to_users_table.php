<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS citext');

        Schema::table('users', function (Blueprint $table) {
            // case-insensitive login identity (database.md §2)
            DB::statement('ALTER TABLE users ALTER COLUMN email TYPE citext USING email::citext');

            $table->string('role', 20)->default('user');
            $table->bigInteger('xp')->default(0);
            $table->integer('solved_count')->default(0);
            $table->string('bio', 500)->nullable();
            $table->string('avatar_path')->nullable();
            $table->timestamp('banned_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->softDeletes();

            $table->index('role');
        });

        // deterministic leaderboard order (docs/database.md §7)
        DB::statement('
            CREATE INDEX users_leaderboard_idx
            ON users (xp DESC, solved_count DESC, id ASC)
            WHERE deleted_at IS NULL
        ');

        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'moderator', 'admin'))");
        DB::statement('ALTER TABLE users ADD CONSTRAINT users_xp_nonneg CHECK (xp >= 0)');
        DB::statement('ALTER TABLE users ADD CONSTRAINT users_solved_nonneg CHECK (solved_count >= 0)');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_leaderboard_idx');
            $table->dropColumn([
                'role', 'xp', 'solved_count', 'bio', 'avatar_path',
                'banned_at', 'last_login_at', 'deleted_at',
            ]);
        });
    }
};
