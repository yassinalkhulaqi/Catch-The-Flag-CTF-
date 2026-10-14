<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Official solution walkthrough (markdown, learning content — never
     * flag plaintext). Served by the challenge detail endpoint only.
     */
    public function up(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->text('solution_walkthrough')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->dropColumn('solution_walkthrough');
        });
    }
};
