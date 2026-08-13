<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'project_id',
        'parent_id',
        'branch_id',
        'section_id',
        'position_id',
        'assigned_id',
        'created_by_id',
        'approved_by_id',
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'priority',
        'task_status',
        'needs_approval',
        'status_approval',
        'rate',
        'amount',
        'due_date',
        'start_date',
        'end_date',
        'completed_date',
        'type',
        'refusal_reason',
        'task_color'
    ];

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function branch()
    {
        return $this->belongsTo(Setting::class, 'branch_id');
    }

    public function section()
    {
        return $this->belongsTo(Setting::class, 'section_id');
    }

    public function position()
    {
        return $this->belongsTo(Setting::class, 'position_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function files()
    {
        return $this->belongsToMany(File::class, 'task_files', 'task_id', 'file_id');
    }

    public function parentTask()
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function subTask()
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    public function notifications()
    {
        return $this->morphMany(Notification::class, 'related');
    }
}
