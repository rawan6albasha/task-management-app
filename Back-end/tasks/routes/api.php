<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::middleware('lang')->group(function () {
Route::controller(AuthController::class)->group(function () {
    Route::post('/login', 'login');
    Route::post('/register', 'register');
    Route::post('/forgot-password','forgotPassword');
    Route::post('/reset-password','resetPassword');

    Route::middleware(['auth:sanctum', 'check.role:employee'])->group(function () {
        Route::get('/user', 'profile');
        Route::post('/logout', 'logout');
        Route::post('/change-password', 'changePassword');
        Route::put('/update-profile', 'updateProfile');
    });
});

Route::controller(ProjectController::class)->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/projects', 'index')->middleware('check.role:employee');
        Route::post('/projects/store', 'store')->middleware('check.role:general_manager');
        Route::put('projects/update/{id}', 'update')->middleware('check.role:general_manager');
        Route::get('/projects/show/{id}', 'show')->middleware('check.role:employee');
        Route::put('/projects/update-status/{id}', 'updateStatusOfProject')->middleware('check.role:general_manager');
        Route::get('/projects/get-inactive', 'inactiveProjects')->middleware('check.role:general_manager');
    });
});

Route::controller(TaskController::class)->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/tasks', 'index')->middleware('check.role:employee');
        Route::post('/tasks/store', 'store')->middleware('check.role:employee');
        Route::put('/tasks/update/{id}', 'update')->middleware('check.role:general_manager');
        Route::get('/tasks/show/{id}', 'show')->middleware('check.role:employee');
        Route::put('/tasks/update-status/{id}', 'updateTaskStatus')->middleware('check.role:employee');
        Route::post('/tasks/approve-task', 'approveTask')->middleware('check.role:section_manager');
        Route::get('/files/view/{id}', 'viewFile');
        Route::get('/files/download/{id}', 'downloadFile');
        Route::delete('/files/delete/{id}', 'deleteFile')->middleware('check.role:employee');
        Route::get('/tasks/export-task','exportTasks')->middleware('check.role:general_manager');
        Route::get('/tasks/export-pdf','exportTasksPDF')->middleware('check.role:general_manager');
        Route::get('/tasks/types','getTaskTypes')->middleware('check.role:section_manager');
    });
});

Route::controller(AdminController::class)->group(function () {
    Route::get('/settings/get', 'getSettingByCode');

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::put('/admin/active-and-deactive/{id}', 'activeDeactive')->middleware('check.role:section_manager');
        Route::get('/admin/get-all-users', 'getAllUsers');
        Route::get('/admin/dashboard-stats', 'getAdminDashboardStats')->middleware('check.role:section_manager');
        Route::get('/admin/get-unread-notifications', 'getUnreadNotifications')->middleware('check.role:section_manager');
        Route::post('/get-user-profile', 'getUserProfile');
        Route::post('/settings/add', 'addSetting')->middleware('check.role:admin');
        Route::put('/settings/update/{id}', 'updateSetting')->middleware('check.role:admin');
        Route::delete('/settings/delete/{id}', 'deleteSetting')->middleware('check.role:admin');
        Route::put('/notifications/mark-as-read/{id}', 'markAsRead');
    });
});
});
