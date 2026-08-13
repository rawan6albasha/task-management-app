<?php

namespace App\Http\Controllers;

use App\Exports\TasksExport;
use App\Models\File;
use App\Models\Task;
use App\Traits\TaskResponse;
use ArPHP\I18N\Arabic;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;

class TaskController extends Controller
{
    use TaskResponse;

    public function index(Request $request)
    {
        $user = auth()->user()->load('position');
        $role = $user->position->value;

        $query = Task::with(['assignedUser', 'creator', 'project', 'branch', 'section', 'files']);

        switch ($role) {
            case 'employee':
                $query->whereHas('project', function ($q) {
                    $q->where('is_active', 1);
                })->where(function ($q) use ($user) {
                    $q->where('assigned_id', $user->id)
                        ->orWhere('created_by_id', $user->id);
                });
                break;

            case 'section_manager':
                $query->where('section_id', $user->section_id);
                break;

            case 'branch_manager':
                $query->where('branch_id', $user->branch_id);
                break;

            case 'admin':
            case 'general_manager':
                break;

            default:
                $query->where('assigned_id', $user->id);
                break;
        }

        if ($request->filled('search')) {
            $searchTerm = strtolower($request->search);
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(title_ar) LIKE ?', ["%{$searchTerm}%"])
                    ->orWhereRaw('LOWER(title_en) LIKE ?', ["%{$searchTerm}%"]);
            });
        }

        $query->when($request->task_status, fn ($q) => $q->where('task_status', $request->task_status))
            ->when($request->project_id, fn ($q) => $q->where('project_id', $request->project_id))
            ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
            ->when($request->assigned_id, fn ($q) => $q->where('assigned_id', $request->assigned_id))
            ->when($request->priority, fn ($q) => $q->where('priority', $request->priority))
            ->when($request->section_id, fn ($q) => $q->where('section_id', $request->section_id));

            if ($request->filled('needs_approval')) {
                $query->where('needs_approval', $request->needs_approval);
            }
        $tasks = $query->latest()->paginate($request->get('per_page', 15));

        return $this->TaskSuccessResponse($tasks, __('tasks.fetched_success'), 200);
    }

    public function show($id)
{
    $validation = Validator::make(['task_id' => $id], [
        'task_id' => 'required|integer|exists:tasks,id',
    ]);

    if ($validation->fails()) {
        return $this->TaskErrorResponse($validation->errors(), 422);
    }

    $task = Task::with([
        'assignedUser',
        'creator',
        'project',
        'branch',
        'section',
        'files',
        'parentTask',
        'subTask',
    ])->find($id);

    $user = auth()->user()->load('position');
    $role = $user->position->value;

    $canAccess = false;

    if (in_array($role, ['admin', 'general_manager'])) {
        $canAccess = true;
    } elseif ($role === 'branch_manager' && $task->branch_id === $user->branch_id) {
        $canAccess = true;
    } elseif ($role === 'section_manager' && $task->section_id === $user->section_id) {
        $canAccess = true;
    } elseif ($task->created_by_id === $user->id || $task->assigned_id === $user->id) {
        $canAccess = true;
    }

    if (! $canAccess) {
        return $this->TaskErrorResponse(__('tasks.access_denied'), 403);
    }

    return $this->TaskSuccessResponse($task, __('tasks.details_retrieved'), 200);
}

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'branch_id' => 'required|exists:settings,id',
            'section_id' => 'required|exists:settings,id',
            'assigned_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'task_color' => 'nullable|string',
            'title_ar' => 'required|string|min:3|max:255',
            'title_en' => 'nullable|string|min:3|max:255',
            'description_ar' => 'sometimes|nullable|string',
            'description_en' => 'sometimes|nullable|string',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'required|date',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date',
            'amount' => 'required|numeric|min:0',
            'needs_approval' => 'sometimes|boolean',
            'parent_id' => 'sometimes|nullable|exists:tasks,id',
            'approved_by_id' => 'nullable|integer|exists:users,id',
            'new_files.*' => 'sometimes|file|mimes:jpg,jpeg,png,pdf,docx|max:5120',
            'library_files.*' => 'sometimes|exists:files,id',
        ]);

        if ($validator->fails()) {
            return $this->TaskErrorResponse($validator->errors(), 422);
        }

        return DB::transaction(function () use ($request) {
            $data = $request->only([
                'project_id', 'parent_id', 'branch_id', 'section_id',
                'assigned_id', 'approved_by_id', 'title_ar', 'title_en',
                'description_ar', 'description_en', 'priority', 'needs_approval',
                'amount', 'due_date', 'start_date', 'type', 'task_color'
            ]);

            $data['created_by_id'] = auth()->id();
            $data['task_status'] = 'pending';

            $task = Task::create($data);

        if ($request->has('library_files')) {
            $task->files()->attach($request->library_files);
        }
        if ($request->hasFile('new_files')) {
            foreach ($request->file('new_files') as $file) {
                $path = $file->store('tasks_attachments', 'public');
                $newFile = File::create([
                    'uploaded_by' => auth()->id(),
                    'name' => $file->getClientOriginalName(),
                    'file_type' => $file->getClientMimeType(),
                    'file_path' => $path,
                ]);
                $task->files()->attach($newFile->id);
            }
        }

        DB::table('notifications')->insert([
            'user_id'      => $task->assigned_id,
            'title'        => __('notifications.new_task_title'),
            'content'      => __('notifications.new_task_content', [
                'title' => $task->title_ar,
                'creator' => auth()->user()->name
            ]),
            'related_id'   => $task->id,
            'related_type' => 'create task', 
            'is_read'      => 0,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return $this->TaskSuccessResponse($task->load('files'), __('tasks.created_success'), 201);
    });
}

public function update(Request $request, $id)
{
    $validator = Validator::make(array_merge(['task_id' => $id], $request->all()), [
        'task_id'         => 'required|exists:tasks,id',
        'project_id'      => 'sometimes|exists:projects,id',
        'parent_id'       => 'sometimes|nullable|exists:tasks,id',
        'branch_id'       => 'sometimes|exists:settings,id',
        'section_id'      => 'sometimes|exists:settings,id',
        'assigned_id'     => 'sometimes|exists:users,id',
        'approved_by_id'  => 'sometimes|nullable|exists:users,id',
        'type'            => 'sometimes|string',
        'task_color'      => 'sometimes|string',
        'title_ar'        => 'sometimes|string|min:3|max:255',
        'title_en'        => 'sometimes|string|min:3|max:255',
        'description_ar'  => 'sometimes|nullable|string',
        'description_en'  => 'sometimes|nullable|string',
        'priority'        => 'sometimes|in:low,medium,high',
        'needs_approval'  => 'sometimes|boolean',
        'amount'          => 'sometimes|numeric|min:0',
        'due_date'        => 'sometimes|date',
        'start_date'      => 'sometimes|date',
        'end_date'        => 'sometimes|nullable|date',
        'new_files.*'     => 'sometimes|file|mimes:jpg,jpeg,png,pdf,docx|max:5120',
        'library_files.*' => 'sometimes|exists:files,id',
    ]);

    if ($validator->fails()) {
        return $this->TaskErrorResponse($validator->errors(), 422);
    }

    $user = auth()->user();

    return DB::transaction(function () use ($request, $user, $id) {
        
        $task = Task::findOrFail($id);

        if ($task->created_by_id !== $user->id) {
            return $this->TaskErrorResponse(__('tasks.denied_update'), 403);
        }

        $task->update($request->only([
            'project_id', 'parent_id', 'branch_id', 'section_id',
            'assigned_id', 'approved_by_id', 'title_ar', 'title_en',
            'description_ar', 'description_en', 'priority', 'needs_approval',
            'amount', 'due_date', 'start_date', 'end_date', 'type','task_color'
        ]));

        if ($request->has('library_files')) {
            $task->files()->syncWithoutDetaching($request->library_files);
        }

        if ($request->hasFile('new_files')) {
            foreach ($request->file('new_files') as $file) {
                $path = $file->store('tasks_attachments', 'public');

                $newFile = File::create([
                    'uploaded_by' => auth()->id(),
                    'name'        => $file->getClientOriginalName(),
                    'file_type'   => $file->getClientMimeType(),
                    'file_path'   => $path,
                ]);

                $task->files()->attach($newFile->id);
            }
        }

        return $this->TaskSuccessResponse($task->load('files'), __('tasks.updated_success'), 200);
    });
}

    public function updateTaskStatus(Request $request,$id)
{
    $validator = Validator::make(array_merge(['task_id' => $id], $request->all()),
        [
            'task_id' => 'required|exists:tasks,id',
        'task_status'  => 'required|in:pending,in_progress,completed,cancelled', 
        ]
    );

    if ($validator->fails()) {
        return $this->TaskErrorResponse($validator->errors(), 422);
    }

    return DB::transaction(function () use ($request, $id) {
        $task = Task::findOrFail($id);
        
        $oldStatusLabel = __("tasks.task_status_{$task->task_status}");
        $newStatusLabel = __("tasks.task_status_{$request->task_status}");

        $task->update(['task_status' => $request->task_status]);

        $notifiedUsers = array_unique([$task->created_by_id, $task->assigned_id]);
        
        foreach ($notifiedUsers as $userId) {
            if ($userId == auth()->id()) continue;

            DB::table('notifications')->insert([
                'user_id'      => $userId,
                'title'        => __('notifications.task_status_title'),
                'content'      => __('notifications.task_status_content', [
                    'title' => $task->title_ar, 
                    'old'   => $oldStatusLabel,
                    'new'   => $newStatusLabel
                ]),
                'related_id'   => $task->id,
                'related_type' => 'update task status', 
                'is_read'      => 0,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        return $this->TaskSuccessResponse($task, __('tasks.status_updated_success'), 200);
    });
}

public function approveTask(Request $request)
{
    $validator = Validator::make($request->all(), [
        'task_id'         => 'required|integer|exists:tasks,id',
        'status_approval' => 'required|in:confirmed,rejected',
        'refusal_reason'  => 'required_if:status_approval,rejected|nullable|string|min:3',
    ]);

    if ($validator->fails()) {
        return $this->TaskErrorResponse($validator->errors(), 422);
    }

    return DB::transaction(function () use ($request) {
        $task = Task::findOrFail($request->task_id);
        $user = auth()->user();

        $task->update([
            'status_approval' => $request->status_approval,
            'refusal_reason'  => $request->status_approval === 'rejected' ? $request->refusal_reason : null,
            'approved_by_id'  => $user->id,
            'task_status'     => $request->status_approval === 'confirmed' ? 'in_progress' : $task->task_status,
        ]);

        $notifiedUsers = array_unique([$task->created_by_id, $task->assigned_id]);
        $statusKey = $request->status_approval === 'confirmed' ? 'approved' : 'rejected';

        $reasonPart = "";
        if ($request->status_approval === 'rejected' && $request->refusal_reason) {
            $reasonPart = "\n" . __('notifications.reason_phrase') . ": " . $request->refusal_reason;
        }

        foreach ($notifiedUsers as $userId) {
            if ($userId == $user->id) continue;

            DB::table('notifications')->insert([
                'user_id'      => $userId,
                'title'        => __('notifications.approval_title'),
                'content'      => __('notifications.approval_content', [
                    'title'       => $task->title_ar,
                    'status'      => __("notifications.status_{$statusKey}"),
                    'reason_part' => $reasonPart
                ]),
                'related_id'   => $task->id,
                'related_type' => 'approve task',
                'is_read'      => 0,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        return $this->TaskSuccessResponse($task, __('tasks.approval_updated'), 200);
    });
}

public function viewFile($id)
{
    $validation = Validator::make(['file_id' => $id], [
        'file_id' => 'required|integer|exists:files,id',
    ]);

    if ($validation->fails()) {
        return $this->TaskErrorResponse($validation->errors(), 422);
    }

    $file = File::findOrFail($id);

    if (! Storage::disk('public')->exists($file->file_path)) {
        return $this->TaskErrorResponse(__('files.not_found'), 404);
    }

    $absolutePath = Storage::disk('public')->path($file->file_path);
    return response()->file($absolutePath);
}

public function downloadFile($id)
{
    $validation = Validator::make(['file_id' => $id], [
        'file_id' => 'required|integer|exists:files,id',
    ]);

    if ($validation->fails()) {
        return $this->TaskErrorResponse($validation->errors(), 422);
    }

    $file = File::findOrFail($id);

    if (! Storage::disk('public')->exists($file->file_path)) {
        return $this->TaskErrorResponse(__('files.not_found'), 404);
    }

    $absolutePath = Storage::disk('public')->path($file->file_path);
    return response()->download($absolutePath, $file->name);
}

    public function deleteFile(Request $request, $id)
{
    $userPosition = auth()->user()->position->value ?? 'default';

    if ($userPosition === 'admin' || $userPosition === 'general_manager') {
        
        $validation = Validator::make(['file_id' => $id], [
            'file_id' => 'required|integer|exists:files,id',
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $file = File::findOrFail($id);

        return DB::transaction(function () use ($file) {
            if (Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }

            $file->delete();

            return $this->TaskSuccessResponse(null, __('files.deleted_permanent'), 200);
        });
    }

 
    $validation = Validator::make(array_merge(['file_id' => $id], $request->all()), [
        'file_id' => 'required|integer|exists:files,id',
        'task_id' => 'required|integer|exists:tasks,id',
    ]);

    if ($validation->fails()) {
        return $this->TaskErrorResponse($validation->errors(), 422);
    }

    $task = Task::findOrFail($request->task_id);
    $user = auth()->user();

    if ($task->created_by_id !== $user->id && $task->assigned_id !== $user->id) {
        return $this->TaskErrorResponse(__('files.denied_task_access'), 403);
    }

    return DB::transaction(function () use ($task, $request, $id) {
        $task->files()->detach($id);

        return $this->TaskSuccessResponse(null, __('files.unlinked_success'), 200);
    });
}
    public function exportTasks()
    {
        return Excel::download(new TasksExport, 'tasks_report.xlsx');
    }

    public function exportTasksPDF(Request $request)
    {
        $tasks = Task::with(['assignedUser', 'creator', 'project'])->get();

        if (class_exists('ArPHP\I18N\Arabic')) {
            $arabic = new Arabic;

            foreach ($tasks as $task) {
                $task->title_ar = $arabic->utf8Glyphs($task->title_ar);
                if ($task->description_ar) {
                    $task->description_ar = $arabic->utf8Glyphs($task->description_ar);
                }
            }
            $reportTitle = $arabic->utf8Glyphs(__('files.report_title'));
        } else {
            $reportTitle = __('files.report_title');
        }

        $pdf = Pdf::loadView('exports.tasks_pdf', compact('tasks', 'reportTitle'));

        return $pdf->download('tasks_report.pdf');
    }

    public function getTaskTypes()
{
    $types = Task::whereNotNull('type')
        ->distinct()
        ->pluck('type'); 

    if ($types->isEmpty()) {
        return $this->TaskSuccessResponse([], __('tasks.no_types_found'), 200);
    }

    $formattedTypes = $types->map(function ($type) {
        return [
            'value' => $type,                         
        ];
    });

    return $this->TaskSuccessResponse($formattedTypes, __('tasks.types_retrieved'), 200);
}
}
