<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Task;
use App\Models\Notification;
use App\Models\User;
use App\Traits\TaskResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    use TaskResponse;

    public function activeDeactive(Request $request, $id)
    {
        $validation = Validator::make(array_merge(['user_id' => $id], $request->all()), [
            'user_id'        => 'required|integer|exists:users,id',
            'account_status' => 'required|in:active,inactive,banned',
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $currentUser = auth()->user()->load('position');
        $currentRole = $currentUser->position->value ?? 'default';

        $targetUser = User::with('position')->findOrFail($id);
        $targetRole = $targetUser->position->value ?? 'default';

        if ($currentRole === 'section_manager') {
            if ($targetUser->section_id !== $currentUser->section_id || $targetRole !== 'employee') {
                return $this->TaskErrorResponse(__('admin.permission_denied_section'), 403);
            }
        }
        elseif ($currentRole === 'branch_manager') {
            if ($targetUser->branch_id !== $currentUser->branch_id || in_array($targetRole, ['admin', 'general_manager'])) {
                return $this->TaskErrorResponse(__('admin.permission_denied_branch'), 403);
            }
        }

        if ($currentUser->id === $targetUser->id) {
            return $this->TaskErrorResponse(__('admin.self_status_error'), 400);
        }

        if ($targetUser->account_status === $request->account_status) {
            return $this->TaskErrorResponse(__('admin.status_already_set', ['status' => $request->account_status]), 400);
        }

        $targetUser->update([
            'account_status' => $request->account_status,
        ]);

        return $this->TaskSuccessResponse(
            $targetUser,
            __('admin.status_update_success', ['name' => $targetUser->name, 'status' => $request->account_status]),
            200
        );
    }

    public function getAllUsers(Request $request)
    {
        $user = auth()->user()->load('position');
        $role = $user->position->value ?? 'default';

        $query = User::with('position');

        if ($role === 'section_manager') {
            $query->where('section_id', $user->section_id)
                ->whereHas('position', function ($q) {
                    $q->where('value', 'employee');
                });
        }

        if ($request->filled('status')) {
            $status = $request->status;
            if (in_array($status, ['active', 'inactive', 'banned'])) {
                $query->where('account_status', $status);
            }
        }

        if ($request->filled('search')) {
            $searchTerm = strtolower($request->search);
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchTerm}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchTerm}%"]);
            });
        }

        $users = $query->latest()->paginate($request->get('per_page', 15));

        if ($users->isEmpty()) {
            return $this->TaskSuccessResponse([], __('admin.no_users_found'), 200);
        }

        return $this->TaskSuccessResponse($users, __('admin.users_retrieved'), 200);
    }
    
    public function getAdminDashboardStats()
{
    $today = now()->toDateString();
    $user = auth()->user()->load('position');
    $role = $user->position->value ?? 'default';

    $taskQuery = Task::query();

    if ($role === 'section_manager') {
        $taskQuery->where('section_id', $user->section_id);
    } 
    elseif ($role === 'branch_manager') {
        $taskQuery->where('branch_id', $user->branch_id);
    }

    $totalTasks = (clone $taskQuery)->count();
    $completedTotal = (clone $taskQuery)->where('task_status', 'completed')->count();
    $completedToday = (clone $taskQuery)->where('task_status', 'completed')
        ->whereDate('completed_date', $today)->count();

    $statusDistribution = (clone $taskQuery)->select('task_status', DB::raw('count(*) as total'))
        ->groupBy('task_status')->get();

    $priorityDistribution = (clone $taskQuery)->select('priority', DB::raw('count(*) as total'))
        ->groupBy('priority')->get();

    $data = [
        'dashboard_date' => $today,
        'overview' => [
            'total_tasks' => $totalTasks,
            'completed_total' => $completedTotal,
            'completed_today' => $completedToday,
        ],
        'status_distribution' => $statusDistribution,
        'priority_distribution' => $priorityDistribution,
    ];

    return $this->TaskSuccessResponse($data, __('admin.stats_retrieved'), 200);
}

    public function getUnreadNotifications()
    {
        $user = auth()->user();

        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('is_read', 0)
            ->orderBy('created_at', 'desc')
            ->get();

        $result = [
            'unread_count' => $unreadNotifications->count(),
            'notifications' => $unreadNotifications,
        ];

        return $this->TaskSuccessResponse($result, __('admin.notifications_retrieved'), 200);
    }

    public function getUserProfile(Request $request)
    {
        $validation = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $userProfile = User::with(['branch', 'section', 'position'])
            ->findOrFail($request->user_id);

        return $this->TaskSuccessResponse($userProfile, __('admin.profile_retrieved'), 200);
    }

    public function addSetting(Request $request)
    {
        $validation = Validator::make($request->all(), [
            'code' => 'required|string',
            'ar_name' => 'required|string',
            'en_name' => 'required|string',
            'value' => 'nullable|string',
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $setting = Setting::create([
            'code' => strtolower($request->code),
            'ar_name' => $request->ar_name,
            'en_name' => $request->en_name,
            'value' => $request->value ?? '',
        ]);

        return $this->TaskSuccessResponse($setting, __('admin.setting_added'), 201);
    }

    public function updateSetting(Request $request, $id)
    {
        $validation = Validator::make(array_merge(['setting_id' => $id], $request->all()), [
            'setting_id' => 'required|integer|exists:settings,id',
            'code'       => 'nullable|string',
            'ar_name'    => 'nullable|string',
            'en_name'    => 'nullable|string',
            'value'      => 'nullable|string',
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $setting = Setting::findOrFail($id);

        $setting->update([
            'code'    => $request->filled('code') ? strtolower($request->code) : $setting->code,
            'ar_name' => $request->ar_name ?? $setting->ar_name,
            'en_name' => $request->en_name ?? $setting->en_name,
            'value'   => $request->has('value') ? $request->value : $setting->value,
        ]);

        return $this->TaskSuccessResponse($setting, __('admin.setting_updated'), 200);
    }

    public function getSettingByCode(Request $request)
    {
        $validation = Validator::make($request->all(), [
            'code' => 'nullable|string', 
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        if ($request->filled('code')) {
            $settings = Setting::where('code', $request->code)->get();

            if ($settings->isEmpty()) {
                return $this->TaskSuccessResponse([], __('admin.no_settings_code', ['code' => $request->code]), 200);
            }

            return $this->TaskSuccessResponse($settings, __('admin.settings_found'), 200);
        }

        $allSettings = Setting::latest()->paginate($request->get('per_page', 15));

        if ($allSettings->isEmpty()) {
            return $this->TaskSuccessResponse([], __('admin.no_settings_found'), 200);
        }

        return $this->TaskSuccessResponse($allSettings, __('admin.settings_found'), 200);
    }

    public function deleteSetting($id)
    {
        $validation = Validator::make(['setting_id' => $id], [
            'setting_id' => 'required|integer|exists:settings,id',
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $setting = Setting::findOrFail($id);
        $setting->delete();

        return $this->TaskSuccessResponse(null, __('admin.setting_deleted'), 200);
    }

    public function markAsRead($id)
    {
        $validator = Validator::make(['notification_id' => $id], [
            'notification_id' => 'required|exists:notifications,id',
        ]);

        if ($validator->fails()) {
            return $this->TaskErrorResponse($validator->errors(), 422);
        }

        $affected = DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', auth()->id()) 
            ->update([
                'is_read' => 1,
                'read_at' => now(), 
            ]);

        if ($affected === 0) {
            return $this->TaskErrorResponse([
                'error' => __('notifications.already_read_dont_belongs'),
                'current_user_id' => auth()->id() 
            ], 403);
        }

        return $this->TaskSuccessResponse(null, __('notifications.noti_as_read'), 200);
    }
}