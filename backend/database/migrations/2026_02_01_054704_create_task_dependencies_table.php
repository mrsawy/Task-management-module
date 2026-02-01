<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->foreignId('task_id')->constrained('tasks');
            $table->foreignId('depends_on_task_id')->constrained('tasks');
            // Add indexes for faster queries
            $table->index('task_id');                          // Single column index
            $table->index('depends_on_task_id');               // Single column index

            // Composite unique index (prevents duplicate dependencies)
            $table->unique(['task_id', 'depends_on_task_id']); // Prevents same pair twice
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
    }
};
