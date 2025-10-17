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

    protected $fillable = ["creator_id", "assignee_id", "title", "description", "due_date", "priority", "is_completed", "entity_type", "entity_url", "meta"];
    protected $casts = [
        'due_date' => 'datetime',
        'meta' => 'json',
    ];
    public function creator()
    {
        return $this->belongsTo(User::class, "creator_id");
    }
    public function assignee()
    {
        return $this->belongsTo(User::class, "assignee_id");
    }

    public function getStatusAttribute(): string
    {
        if ($this->is_completed) {
            return 'done';
        }

        $today = Carbon::today();
        $dueDate = Carbon::parse($this->due_date);

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
            'done' => $query->where('is_completed', true),
            'missed' => $query->where('is_completed', false)
                ->where('due_date', '<', $today),
            'due_today' => $query->where('is_completed', false)
                ->whereDate('due_date', $today),
            'upcoming' => $query->where('is_completed', false)
                ->where('due_date', '>', $today),
            default => $query
        };
    }

    // ==================== System Context ====================
    public function getSystemContext()
    {
        if (isset($this->meta['hr_context'])) return 'hr';
        if (isset($this->meta['crm_context'])) return 'crm';
        if (isset($this->meta['lms_context'])) return 'lms';
        if (isset($this->meta['erp_context'])) return 'erp';
        return null;
    }

    public function getSystemType()
    {
        $context = $this->getSystemContext();

        return match ($context) {
            'hr' => $this->meta['hr_type'] ?? null,
            'crm' => $this->meta['crm_type'] ?? null,
            'lms' => $this->meta['lms_type'] ?? null,
            'erp' => $this->meta['erp_type'] ?? null,
            default => null,
        };
    }
}
