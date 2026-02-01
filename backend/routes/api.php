<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::group([
    'prefix' => 'auth'
], function ($router) {
    Route::post('signup', [AuthController::class, 'signup']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
});


// Task routes
Route::prefix('tasks')->group(function () {
    // View tasks - permission check handled in controller (complex logic: view_all OR view_assigned)
    Route::get('/', [TaskController::class, 'index']);

    // Create task - only managers
    Route::post('/', [TaskController::class, 'store'])
        ->middleware('permission:tasks,create');

    Route::get('/created', [TaskController::class, 'createdTasks']);
    Route::get('/{id}', [TaskController::class, 'show']);

    // Update task - permission check handled in controller (complex logic: update OR update_status)
    Route::put('/{id}', [TaskController::class, 'update']);

    Route::delete('/{id}', [TaskController::class, 'destroy']);

    // Reassign task - only managers
    Route::put('/{id}/assign', [TaskController::class, 'reassign'])
        ->middleware('permission:tasks,assign');

    Route::put('/{id}/complete', [TaskController::class, 'toggleComplete']);
});

// User routes
Route::prefix('users')->group(function () {
    // Get current user (authenticated users)
    Route::get('/me', [UserController::class, 'me']);

    // Get roles (for forms)
    Route::get('/roles', [UserController::class, 'roles']);

    // User management (only managers)
    Route::get('/', [UserController::class, 'index'])
        ->middleware('permission:users,view_all');
    Route::get('/{id}', [UserController::class, 'show'])
        ->middleware('permission:users,view_all');
    Route::post('/', [UserController::class, 'store'])
        ->middleware('permission:users,create');
    Route::put('/{id}', [UserController::class, 'update'])
        ->middleware('permission:users,update');
    Route::delete('/{id}', [UserController::class, 'destroy'])
        ->middleware('permission:users,delete');
});
