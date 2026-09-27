<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('path_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('path_id')->constrained('paths')->cascadeOnDelete();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['path_id', 'position']);
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('path_modules')->cascadeOnDelete();
            $table->string('title', 160);
            $table->string('slug', 160);
            $table->string('summary', 400)->nullable();
            $table->text('content');
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('estimated_minutes')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->unique(['module_id', 'slug']);
            $table->index(['module_id', 'position']);
        });

        DB::statement('ALTER TABLE lessons ADD CONSTRAINT lessons_minutes_check CHECK (estimated_minutes >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('path_modules');
    }
};
