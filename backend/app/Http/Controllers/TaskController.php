<?php

namespace App\Http\Controllers;

use App\Events\TaskAssigned;
use App\Events\Tasks;
use App\Helpers\BroadcastsSafely;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller as BaseController;

class TaskController extends BaseController
{
    use BroadcastsSafely;

    /** @var User|null */
    protected $user;
    protected $userPermissions = [];

    public function __construct()
    {
        $this->middleware('auth:api');

        // Load user and permissions after authentication
        $this->middleware(function ($request, $next) {
            /** @var User|null $user */
            $this->user = Auth::user();

            // Eager load role with permissions to avoid N+1 queries
            if ($this->user && !$this->user->relationLoaded('role')) {
                /** @var User $user */
                $user = $this->user;
                $user->load('role.permissions');
            }

            // Cache permissions for quick access
            if ($this->user && $this->user->role) {
                $this->userPermissions = $this->user->role->permissions
                    ->map(fn($permission) => "{$permission->subject}.{$permission->action}")
                    ->toArray();
            }

            return $next($request);
        });
    }

    /**
     * Helper method to check if user has permission
     * Uses cached permissions from constructor
     */
    protected function hasPermission(string $subject, string $action): bool
    {
        if (!$this->user) {
            return false;
        }

        $permission = "{$subject}.{$action}";
        return in_array($permission, $this->userPermissions) ||
            $this->user->hasPermission($subject, $action);
    }

    /**
     * Get all tasks for the current user
     * GET /api/tasks
     */
    public function index(Request $request)
    {
        $user = $this->user;

        // Check if user can view all tasks (manager) or only assigned tasks (worker)
        if ($this->hasPermission('tasks', 'view_all')) {
            // Managers can see all tasks
            $query = Task::with(['creator:id,name,email', 'assignee:id,name,email']);
        } elseif ($this->hasPermission('tasks', 'view_assigned')) {
            // Workers can only see tasks assigned to them
            $query = Task::with(['creator:id,name,email', 'assignee:id,name,email'])
                ->where('assignee_id', $user->id);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view tasks.'
            ], 403);
        }

        $query->orderBy("due_date");

        // Filter by status (workflow status: to-do, in-progress, review, done)
        if ($request->has('status') && in_array($request->status, ['to-do', 'in-progress', 'review', 'done'])) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'due_date');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSorts = ['due_date', 'priority', 'created_at', 'title'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $tasks = $query->get();

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    /**
     * Create a new task
     * POST /api/tasks
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date|after_or_equal:today',
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'status' => ['nullable', Rule::in(['to-do', 'in-progress', 'review', 'done'])],
            'assignee_id' => 'required|exists:users,id',
            'dependency_ids' => 'nullable|array',
            'dependency_ids.*' => 'exists:tasks,id',
            'dependent_ids' => 'nullable|array',
            'dependent_ids.*' => 'exists:tasks,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Permission check is handled by middleware, but we can use cached permissions here too

        // Verify assignee exists
        $assignee = User::find($request->assignee_id);

        if (!$assignee) {
            return response()->json([
                'success' => false,
                'message' => 'Assignee not found'
            ], 404);
        }

        $task = Task::create([
            'creator_id' => Auth::id(),
            'assignee_id' => $request->assignee_id,
            'title' => $request->title,
            'description' => $request->description,
            'due_date' => $request->due_date,
            'priority' => $request->priority,
            'status' => $request->status ?? 'to-do'
        ]);

        // Handle dependencies (tasks this task depends on)
        if ($request->has('dependency_ids') && is_array($request->dependency_ids)) {
            $dependencyTasks = Task::whereIn('id', $request->dependency_ids)->get();
            foreach ($dependencyTasks as $dependencyTask) {
                /** @var Task $dependencyTask */
                $task->addDependency($dependencyTask);
            }
        }

        // Handle dependents (tasks that depend on this task)
        if ($request->has('dependent_ids') && is_array($request->dependent_ids)) {
            $dependentTasks = Task::whereIn('id', $request->dependent_ids)->get();
            foreach ($dependentTasks as $dependentTask) {
                /** @var Task $dependentTask */
                $task->addDependent($dependentTask);
            }
        }

        $task->load(['creator:id,name,email', 'assignee:id,name,email', 'dependencies', 'dependents']);

        // Safely broadcast events - won't throw errors if Reverb is unavailable
        $this->safeBroadcast(new Tasks($assignee->id, "New Task Created"));

        try {
            TaskAssigned::dispatch($task);
        } catch (\Illuminate\Broadcasting\BroadcastException $e) {
            // Log but don't throw - broadcasting is optional
            Log::warning('Broadcasting failed (non-critical): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $task
        ], 201);
    }

    /**
     * Get a task
     * GET /api/tasks/{id}
     */
    public function show($id)
    {
        $task = Task::with([
            'creator:id,name,email',
            'assignee:id,name,email',
            'dependencies.creator:id,name,email',
            'dependencies.assignee:id,name,email',
            'dependents.creator:id,name,email',
            'dependents.assignee:id,name,email'
        ])->find($id);
        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found'
            ], 404);
        }
        return response()->json([
            'success' => true,
            'data' => $task
        ]);
    }
    /**
     * Update a task
     * PUT /api/tasks/{id}
     */
    public function update(Request $request, $id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found'
            ], 404);
        }

        $user = $this->user;
        $isAssignee = $task->assignee_id === $user->id;
        $isManager = $this->hasPermission('tasks', 'update');
        $canUpdateStatus = $this->hasPermission('tasks', 'update_status');

        // Check permissions
        if (!$isManager && !$isAssignee) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to update this task.'
            ], 403);
        }

        // If user is not a manager, they can only update status
        if (!$isManager && $isAssignee) {
            if (!$canUpdateStatus) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update task status.'
                ], 403);
            }

            // Workers can only update status field
            $validator = Validator::make($request->all(), [
                'status' => ['required', Rule::in(['to-do', 'in-progress', 'review', 'done'])]
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // If trying to mark as done, check that all dependencies are completed
            if ($request->status === 'done' && $task->status !== 'done') {
                $dependencies = $task->dependencies;
                $incompleteDependencies = $dependencies->filter(function ($dependency) {
                    return $dependency->status !== 'done';
                });

                if ($incompleteDependencies->isNotEmpty()) {
                    $incompleteTitles = $incompleteDependencies->pluck('title')->implode(', ');
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot complete task. The following dependencies must be completed first: ' . $incompleteTitles
                    ], 422);
                }
            }

            // Update status
            $task->update([
                'status' => $request->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Task status updated successfully',
                'data' => $task->load(['creator:id,name,email', 'assignee:id,name,email'])
            ]);
        }

        // Managers can update all fields
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'sometimes|required|date',
            'priority' => ['sometimes', 'required', Rule::in(['low', 'medium', 'high'])],
            'status' => ['sometimes', 'required', Rule::in(['to-do', 'in-progress', 'review', 'done'])],
            'dependency_ids' => 'nullable|array',
            'dependency_ids.*' => 'exists:tasks,id',
            'dependent_ids' => 'nullable|array',
            'dependent_ids.*' => 'exists:tasks,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // If trying to mark as done, check that all dependencies are completed
        $newStatus = $request->has('status') ? $request->status : $task->status;
        if ($newStatus === 'done' && $task->status !== 'done') {
            $dependencies = $task->dependencies;
            $incompleteDependencies = $dependencies->filter(function ($dependency) {
                return $dependency->status !== 'done';
            });

            if ($incompleteDependencies->isNotEmpty()) {
                $incompleteTitles = $incompleteDependencies->pluck('title')->implode(', ');
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot complete task. The following dependencies must be completed first: ' . $incompleteTitles
                ], 422);
            }
        }

        // Prepare update data
        $updateData = $request->only([
            'title',
            'description',
            'due_date',
            'priority',
            'status'
        ]);

        $task->update($updateData);

        // Handle dependencies update
        if ($request->has('dependency_ids')) {
            // Get current dependency IDs
            $currentDependencyIds = $task->dependencies->pluck('id')->toArray();
            $newDependencyIds = $request->dependency_ids ?? [];

            // Remove dependencies that are no longer selected
            $toRemove = array_diff($currentDependencyIds, $newDependencyIds);
            foreach ($toRemove as $dependencyId) {
                $dependencyTask = Task::find($dependencyId);
                if ($dependencyTask) {
                    $task->removeDependency($dependencyTask);
                }
            }

            // Add new dependencies
            $toAdd = array_diff($newDependencyIds, $currentDependencyIds);
            $dependencyTasks = Task::whereIn('id', $toAdd)->get();
            foreach ($dependencyTasks as $dependencyTask) {
                /** @var Task $dependencyTask */
                $task->addDependency($dependencyTask);
            }
        }

        // Handle dependents update
        if ($request->has('dependent_ids')) {
            // Get current dependent IDs
            $currentDependentIds = $task->dependents->pluck('id')->toArray();
            $newDependentIds = $request->dependent_ids ?? [];

            // Remove dependents that are no longer selected
            $toRemove = array_diff($currentDependentIds, $newDependentIds);
            foreach ($toRemove as $dependentId) {
                $dependentTask = Task::find($dependentId);
                if ($dependentTask) {
                    // Detach the relationship (dependent task depends on this task)
                    $task->dependents()->detach($dependentId);
                }
            }

            // Add new dependents
            $toAdd = array_diff($newDependentIds, $currentDependentIds);
            $dependentTasks = Task::whereIn('id', $toAdd)->get();
            foreach ($dependentTasks as $dependentTask) {
                /** @var Task $dependentTask */
                $task->addDependent($dependentTask);
            }
        }

        $task->load(['creator:id,name,email', 'assignee:id,name,email', 'dependencies', 'dependents']);


        //event(new Tasks($task->assignee_id, "Task Updated . "));

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $task
        ]);
    }

    /**
     * Delete a task
     * DELETE /api/tasks/{id}
     */
    public function destroy($id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found'
            ], 404);
        }

        // Check if user is either the creator or assignee
        if ($task->creator_id !== Auth::id() && $task->assignee_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only the creator or assignee can delete this task.'
            ], 403);
        }

        // Check if all dependencies are completed before deletion
        $dependencies = $task->dependencies;
        $incompleteDependencies = $dependencies->filter(function ($dependency) {
            return $dependency->status !== 'done';
        });

        if ($incompleteDependencies->isNotEmpty()) {
            $incompleteTitles = $incompleteDependencies->pluck('title')->implode(', ');
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete task. The following dependencies must be completed first: ' . $incompleteTitles
            ], 422);
        }

        $taskId = $task->id;
        $assigneeId = $task->assignee_id;
        $creatorId = $task->creator_id;


        //event(new Tasks($task->assignee_id, "Task deleted . "));
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully'
        ]);
    }

    /**
     * Reassign a task
     * PUT /api/tasks/{id}/assign
     */
    public function reassign(Request $request, $id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found'
            ], 404);
        }

        // Check if user is the creator
        if ($task->creator_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only the task creator can reassign this task.'
            ], 403);
        }

        $validator = Validator::make(
            $request->all(),
            [
                'assignee_email' => 'required|email|exists:users,email',
            ],
            [
                'assignee_email.required' => 'Please enter the assignee email.',
                'assignee_email.email' => 'The email format is invalid.',
                'assignee_email.exists' => 'Assignee email not found .',
            ]
        );


        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $newAssignee = User::where('email', $request->assignee_email)->first();

        if (!$newAssignee) {
            return response()->json([
                'success' => false,
                'message' => 'New assignee not found'
            ], 404);
        }

        $task->update([
            'assignee_id' => $newAssignee->id
        ]);

        $task->load(['creator:id,name,email', 'assignee:id,name,email']);

        // Safely broadcast events - won't throw errors if Reverb is unavailable
        try {
            //event(new Tasks($task->assignee_id, "You have a new Task . "));
            TaskAssigned::dispatch($task);
        } catch (\Illuminate\Broadcasting\BroadcastException $e) {
            // Log but don't throw - broadcasting is optional
            Log::warning('Broadcasting failed (non-critical): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Task reassigned successfully',
            'data' => $task
        ]);
    }

    /**
     * Toggle task completion status
     * PUT /api/tasks/{id}/complete
     */
    public function toggleComplete($id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found'
            ], 404);
        }

        // Check if user is the assignee
        if ($task->assignee_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only the assignee can complete this task.'
            ], 403);
        }

        // If trying to mark as done, check that all dependencies are completed
        $newStatus = $task->status === 'done' ? 'to-do' : 'done';
        if ($newStatus === 'done' && $task->status !== 'done') {
            $dependencies = $task->dependencies;
            $incompleteDependencies = $dependencies->filter(function ($dependency) {
                return $dependency->status !== 'done';
            });

            if ($incompleteDependencies->isNotEmpty()) {
                $incompleteTitles = $incompleteDependencies->pluck('title')->implode(', ');
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot complete task. The following dependencies must be completed first: ' . $incompleteTitles
                ], 422);
            }
        }

        $task->update([
            'status' => $newStatus
        ]);

        $task->load(['creator:id,name,email', 'assignee:id,name,email']);

        return response()->json([
            'success' => true,
            'message' => $task->status === 'done' ? 'Task marked as completed' : 'Task marked as incomplete',
            'data' => $task
        ]);
    }

    /**
     * Get tasks created by the current user
     * GET /api/tasks/created
     */
    public function createdTasks(Request $request)
    {
        $query = Task::with(['creator:id,name,email', 'assignee:id,name,email'])
            ->where('creator_id', Auth::id())->orderBy("due_date", "desc");

        // Apply same filters as index
        if ($request->has('status') && in_array($request->status, ['to-do', 'in-progress', 'review', 'done'])) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        $sortBy = $request->get('sort_by', 'due_date');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSorts = ['due_date', 'priority', 'created_at', 'title'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $tasks = $query->get();

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }
}
