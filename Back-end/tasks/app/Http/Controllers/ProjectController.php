<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Traits\TaskResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    use TaskResponse;

    public function index()
    {
        $user = auth()->user()->load('position');

        $projects = Project::visibleToUser($user)->with('tasks')->latest()->get();

        if ($projects->isEmpty()) {
            return $this->TaskSuccessResponse([], __('projects.no_projects'), 200);
        }

        return $this->TaskSuccessResponse($projects, __('projects.fetched_success'), 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'expected_expired_date' => 'required|date',
            'project_amount' => 'required|numeric',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'status' => 'required|in:starting_soon,in_progress,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return $this->TaskErrorResponse($validator->errors(), 422);
        }

        $project = Project::create([
            'name_ar' => $request->name_ar,
            'name_en' => $request->name_en,
            'start_date' => $request->start_date,
            'expected_expired_date' => $request->expected_expired_date,
            'project_amount' => $request->project_amount,
            'description_ar' => $request->description_ar,
            'description_en' => $request->description_en,
            'status' => $request->status,
            'is_active' => $request->is_active ?? true,
        ]);

        return $this->TaskSuccessResponse($project, __('projects.created_success'), 201);
    }

    public function show($id)
    {
    $validation = Validator::make(['project_id' => $id], [
        'project_id' => 'required|integer|exists:projects,id',
    ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $user = auth()->user()->load('position');

        $project = Project::visibleToUser($user)->with('tasks')->find($id);

        if (! $project) {
            return $this->TaskErrorResponse(__('projects.not_found_or_denied'), 403);
        }

        return $this->TaskSuccessResponse($project, __('projects.details_retrieved'), 200);
    }

    public function update(Request $request,$id)
{
    $validation = Validator::make(['project_id' => $id],[
        'project_id' => 'required|integer|exists:projects,id'
    ]);

    if($validation->fails())
    {
        return $this->TaskErrorResponse($validation->errors(),422);
    }

    $project = Project::find($id);

    if (!$project) {
        return $this->TaskErrorResponse(__('projects.not_found'), 404);
    }

    $currentUser = auth()->user()->load('position');
    $currentRole = $currentUser->position->value;

    if ($currentRole === 'employee') {
        return $this->TaskErrorResponse(__('projects.denied_update'), 403);
    }

    $validator = Validator::make($request->all(), [
        'name_ar' => 'nullable|string|max:255',
        'name_en' => 'nullable|string|max:255',
        'start_date' => 'nullable|date',
        'expected_expired_date' => 'nullable|date',
        'project_amount' => 'nullable|numeric',
        'description_ar' => 'nullable|string',
        'description_en' => 'nullable|string',
        'status' => 'nullable|in:starting_soon,in_progress,completed,cancelled',
        'is_active' => 'nullable|boolean',
    ]);

    if ($validator->fails()) {
        return $this->TaskErrorResponse($validator->errors(), 422);
    }

    $project->update($request->only([
        'name_ar', 'name_en', 'start_date', 'expected_expired_date',
        'project_amount', 'description_ar', 'description_en', 'status', 'is_active'
    ]));

    return $this->TaskSuccessResponse($project, __('projects.updated_success'), 200);
}

    public function updateStatusOfProject(Request $request, $id)
    {
        $validation = Validator::make(
            array_merge(['project_id' => $id], $request->all()), 
            [
                'project_id' => 'required|integer|exists:projects,id',
                'action'     => 'required|in:0,1',
            ]
        );

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $currentUser = auth()->user()->load('position');
        $currentRole = $currentUser->position->value;

        if ($currentRole === 'employee') {
            return $this->TaskErrorResponse(__('projects.denied_employee_status'), 403);
        }

        $project = Project::findOrFail($id);

        if ($currentRole === 'branch_manager' && isset($project->branch_id)) {
            if ($project->branch_id !== $currentUser->branch_id) {
                return $this->TaskErrorResponse(__('projects.denied_branch_manage'), 403);
            }
        }

        if ($project->is_active == $request->action) {
            $statusKey = $request->action ? 'active' : 'inactive';
            return $this->TaskErrorResponse(__('projects.already_set', ['status' => __('projects.' . $statusKey)]), 400);
        }

        $project->update([
            'is_active' => $request->action,
        ]);

        return $this->TaskSuccessResponse($project, __('projects.status_updated_success'), 200);
    }

    public function inactiveProjects()
    {
        $projects = Project::where('is_active',0)->get();
        if($projects->isEmpty())
        {
            return $this->TaskSuccessResponse([],__('projects.No_inactive_projects'),200);
        }
        return $this->TaskSuccessResponse($projects,__('projects.inactive_pro_list'),200);
    }
}
