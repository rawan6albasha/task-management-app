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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('settings')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained('settings')->cascadeOnDelete();
            $table->foreignId('position_id')->constrained('settings')->cascadeOnDelete();
            $table->foreignId('assigned_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('title_ar');
            $table->string('title_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->enum('priority', ['low', 'medium', 'high']);
            $table->enum('task_status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->boolean('needs_approval')->default(false);
            $table->enum('status_approval', ['pending', 'confirmed', 'rejected'])->default('pending');
            $table->unsignedTinyInteger('rate')->default(0);
            $table->double('amount')->default(0);
            $table->date('due_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
