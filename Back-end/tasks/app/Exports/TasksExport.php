<?php

namespace App\Exports;

use App\Models\Task;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping; 

class TasksExport implements FromCollection, WithHeadings,WithMapping
{
    /**
     * @return Collection
     */
    public function collection()
    {
        return Task::all([
            'id',
            'project_id',
            'parent_id',
            'branch_id',
            'section_id',
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
        ]);
    }

    public function headings(): array
    {
        return [
            '#',
            __('tasks.project'),
            __('tasks.parent_task'),
            __('tasks.branch'),
            __('tasks.section'),
            __('tasks.assigned_to'),
            __('tasks.created_by'),
            __('tasks.approved_by'),
            __('tasks.title_ar'),
            __('tasks.title_en'),
            __('tasks.description_ar'),
            __('tasks.description_en'),
            __('tasks.priority'),
            __('tasks.status'),
            __('tasks.needs_approval'),
            __('tasks.approval_status'),
            __('tasks.rate'),
            __('tasks.amount'),
            __('tasks.due_date'),
            __('tasks.start_date'),
            __('tasks.end_date'),
            __('tasks.completed_date'),
            __('tasks.type'),
            __('tasks.refusal_reason'),
        ];
    }


    public function map($task): array
    {
        return [
            $task->id,
            $task->project?->name_ar ?? $task->project_id, 
            $task->parent_id,
            $task->branch?->name_ar ?? $task->branch_id,
            $task->section?->name_ar ?? $task->section_id,
            $task->assignedUser?->name ?? $task->assigned_id,
            $task->creator?->name ?? $task->created_by_id,
            $task->approved_by_id,
            $task->title_ar,
            $task->title_en,
            $task->description_ar,
            $task->description_en,
            __("tasks.priority_{$task->priority}"), 
            __("tasks.status_{$task->task_status}"), 
            $task->needs_approval ? __('tasks.yes') : __('tasks.no'),
            __("notifications.status_{$task->status_approval}"), 
            $task->rate,
            $task->amount,
            $task->due_date,
            $task->start_date,
            $task->end_date,
            $task->completed_date,
            $task->type,
            $task->refusal_reason,
        ];
    }
}