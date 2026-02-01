<?php

namespace App\Models;

use App\Models\Traits\ERPTaskTrait;
use App\Models\Traits\HRTaskTrait;
use App\Models\Traits\LMSTaskTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;


class Task  extends Model
{
    use HasFactory, HRTaskTrait, LMSTaskTrait, ERPTaskTrait;

    protected $fillable = [
        "creator_id",
        "assignee_id",
        "title",
        "description",
        "due_date",
        "priority",
        "status",
        "entity_type",
        "entity_url",
        "meta"
    ];
    protected $casts = [
        'due_date' => 'datetime',
        'meta' => 'json',
    ];

    /**
     * Get is_completed attribute based on status
     * For backward compatibility with existing code
     */
    public function getIsCompletedAttribute(): bool
    {
        return $this->getAttribute('status') === 'done';
    }
    public function creator()
    {
        return $this->belongsTo(User::class, "creator_id");
    }
    public function assignee()
    {
        return $this->belongsTo(User::class, "assignee_id");
    }

    /**
     * Tasks that THIS task depends on (must be completed before this task)
     * "What do I need to wait for?"
     */
    public function dependencies()
    {
        return $this->belongsToMany(
            Task::class,
            'task_dependencies',    // pivot table
            'task_id',              // foreign key of THIS model on pivot
            'depends_on_task_id'    // foreign key of RELATED model on pivot
        );
    }

    /**
     * Tasks that depend ON this task (blocked until this task is done)
     * "What is waiting for me?"
     */
    public function dependents()
    {
        return $this->belongsToMany(
            Task::class,
            'task_dependencies',    // pivot table
            'depends_on_task_id',   // foreign key of THIS model on pivot
            'task_id'               // foreign key of RELATED model on pivot
        );
    }
    public function addDependency(Task $task)
    {
        if (!$this->dependencies()->where('depends_on_task_id', $task->getKey())->exists()) {
            $this->dependencies()->attach($task);
        }
        return $this;
    }
    public function removeDependency(Task $task)
    {
        if ($this->dependencies()->where('depends_on_task_id', $task->getKey())->exists()) {
            $this->dependencies()->detach($task);
        }
        return $this;
    }
    public function addDependent(Task $task)
    {
        if (!$this->dependents()->where('task_id', $task->getKey())->exists()) {
            $this->dependents()->attach($task);
        }
        return $this;
    }
    /**
     * Get the task status (computed from status field and due date)
     * This is kept for backward compatibility with frontend status computation
     */
    public function getTaskStatusAttribute(): string
    {
        // If status is 'done', return 'done'
        if ($this->getAttribute('status') === 'done') {
            return 'done';
        }

        $today = Carbon::today();
        $dueDate = Carbon::parse($this->getAttribute('due_date'));

        if ($dueDate->isPast()) {
            return 'missed';
        }

        if ($dueDate->isToday()) {
            return 'due_today';
        }

        return 'upcoming';
    }
    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assignee_id', $userId);
    }

    // Scope for filtering by status
    public function scopeByStatus($query, $status)
    {
        $today = Carbon::today();

        return match ($status) {
            'done' => $query->where('status', 'done'),
            'missed' => $query->where('status', '!=', 'done')
                ->where('due_date', '<', $today),
            'due_today' => $query->where('status', '!=', 'done')
                ->whereDate('due_date', $today),
            'upcoming' => $query->where('status', '!=', 'done')
                ->where('due_date', '>', $today),
            default => $query
        };
    }
}
