<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ERPTaskController;
use App\Http\Controllers\HRTaskController;
use App\Http\Controllers\LMSTaskController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\BroadcastController;

Route::group([
    'prefix' => 'auth'
], function ($router) {
    Route::post('signup', [AuthController::class, 'signup']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
});


// Task routes
Route::prefix('tasks')->group(function () {
    Route::get('/', [TaskController::class, 'index']);
    Route::post('/', [TaskController::class, 'store']);
    Route::get('/created', [TaskController::class, 'createdTasks']);
    Route::put('/{id}', [TaskController::class, 'update']);
    Route::delete('/{id}', [TaskController::class, 'destroy']);
    Route::put('/{id}/assign', [TaskController::class, 'reassign']);
    Route::put('/{id}/complete', [TaskController::class, 'toggleComplete']);


    // ==================== HR Integration ====================
    Route::prefix('hr')->group(function () {
        Route::post('/onboarding-checklist', [HRTaskController::class, 'createOnboardingChecklist']);
        Route::get('/onboarding-progress/{employeeId}', [HRTaskController::class, 'getOnboardingProgress']);
        Route::get('/department-summary/{departmentId}', [HRTaskController::class, 'getDepartmentTasksSummary']);
        Route::post('/performance-review', [HRTaskController::class, 'createPerformanceReviewTask']);
    });

    // ==================== LMS Integration ====================
    Route::prefix('lms')->group(function () {
        Route::post('/assignment', [LMSTaskController::class, 'createCourseAssignment']);
        Route::post('/quiz', [LMSTaskController::class, 'createQuizTask']);
        Route::post('/tasks/{task}/quiz-completion', [LMSTaskController::class, 'recordQuizCompletion']);
        Route::get('/course/{courseId}', [LMSTaskController::class, 'getCourseProgress']);
        Route::get('/learner/{learnerId}', [LMSTaskController::class, 'getLearnerTranscript']);
    });

    // ==================== ERP Integration ====================
    Route::prefix('erp')->group(function () {
        Route::post('/procurement', [ERPTaskController::class, 'createProcurementTask']);
        Route::post('/inventory', [ERPTaskController::class, 'createInventoryTask']);
        Route::get('/procurement-pipeline', [ERPTaskController::class, 'getProcurementPipeline']);
        Route::get('/inventory/{inventoryId}', [ERPTaskController::class, 'getInventoryStockStatus']);
    });
});
