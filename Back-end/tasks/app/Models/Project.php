<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name_ar',
        'name_en',
        'start_date',
        'expected_expired_date',
        'project_amount',
        'description_en',
        'description_ar',
        'status',
        'is_active',
    ];

    public function tasks()
    {
        return $this->hasMany(Task::class, 'project_id');
    }

    public function scopeVisibleToUser($query, $user)
    {
        $role = $user->position->value;

        if (in_array($role, ['admin', 'general_manager'])) {
            return $query;
        }

        if (in_array($role, ['branch_manager', 'section_manager'])) {
            return $query->where('is_active', 1);
        }

        return $query->where('is_active', 1)
            ->whereHas('tasks', function ($q) use ($user) {
                $q->where('assigned_id', $user->id);
            });
    }
}
