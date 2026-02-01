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
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('subject'); // e.g., 'tasks', 'users', etc.
            $table->string('action');  // e.g., 'create', 'update', 'delete', 'view', etc.
            $table->timestamps();
            
            // Ensure unique combination of subject and action
            $table->unique(['subject', 'action']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
