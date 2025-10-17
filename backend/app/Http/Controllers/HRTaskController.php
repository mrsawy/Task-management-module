<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class HRTaskController extends Controller
{

    /**
     * Create onboarding task checklist for new employee
     */
    public function createOnboardingChecklist(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer',
            'employee_email' => 'required|email|exists:users,email',
            'tasks' => 'required|array',
            'tasks.*.title' => 'required|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.due_date' => 'required|date',
        ]);

        $assignee = User::where('email', $validated['employee_email'])->first();
        $createdTasks = [];

        foreach ($validated['tasks'] as $taskData) {
            $task = Task::create([
                'creator_id' => $request->user()->id,
                'assignee_id' => $assignee->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'] ?? null,
                'due_date' => $taskData['due_date'],
                'priority' => 'high',
                'meta' => [
                    'hr_type' => 'onboarding',
                    'hr_employee_id' => $validated['employee_id'],
                    'onboarding_stage' => 'initial',
                ],
            ]);

            $createdTasks[] = $task;
        }

        return response()->json([
            'message' => 'Onboarding checklist created',
            'tasks' => $createdTasks,
            'total' => count($createdTasks),
        ], 201);
    }

    /**
     * Get employee onboarding progress
     */
    public function getOnboardingProgress(Request $request, int $employeeId)
    {
        $tasks = Task::where('meta->hr_type', 'onboarding')
            ->where('meta->hr_employee_id', $employeeId)
            ->get();

        $completed = $tasks->where('is_completed', true)->count();
        $total = $tasks->count();
        $progress = $total > 0 ? ($completed / $total) * 100 : 0;

        return response()->json([
            'employee_id' => $employeeId,
            'total_tasks' => $total,
            'completed_tasks' => $completed,
            'progress_percentage' => round($progress, 2),
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get department tasks summary
     */
    public function getDepartmentTasksSummary(Request $request, string $departmentId)
    {
        $tasks = Task::where('meta->hr_department_id', $departmentId)->get();

        return response()->json([
            'department_id' => $departmentId,
            'total_tasks' => $tasks->count(),
            'completed' => $tasks->where('is_completed', true)->count(),
            'pending' => $tasks->where('is_completed', false)->count(),
            'overdue' => $tasks->where('is_completed', false)
                ->where('due_date', '<', now()->startOfDay())
                ->count(),
        ]);
    }

    /**
     * Assign performance review task
     */
    public function createPerformanceReviewTask(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer',
            'employee_email' => 'required|email|exists:users,email',
            'review_period' => 'required|string',
            'due_date' => 'required|date',
        ]);

        $assignee = User::where('email', $validated['employee_email'])->first();

        $task = Task::create([
            'creator_id' => $request->user()->id,
            'assignee_id' => $assignee->id,
            'title' => "Performance Review - {$validated['review_period']}",
            'description' => "Complete your performance review for period: {$validated['review_period']}",
            'due_date' => $validated['due_date'],
            'priority' => 'high',
            'meta' => [
                'hr_type' => 'performance_review',
                'hr_employee_id' => $validated['employee_id'],
                'review_period' => $validated['review_period'],
            ],
        ]);

        return response()->json([
            'message' => 'Performance review task created',
            'task' => $task,
        ], 201);
    }
}
