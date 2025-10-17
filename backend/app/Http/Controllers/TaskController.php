<?php

namespace App\Http\Controllers;

use App\Events\TaskAssigned;
use App\Events\Tasks;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller as BaseController;

class TaskController extends BaseController
{

    public function __construct()
    {
        $this->middleware('auth:api');
    }
    /**
     * Get all tasks for the current user
     * GET /api/tasks
     */
    public function index(Request $request)
    {
        $query = Task::with(['creator:id,name,email', 'assignee:id,name,email'])
            ->where('assignee_id', Auth::id())->orderBy("due_date");

        // Filter by status
        if ($request->has('status')) {
            $isCompleted = $request->status === 'completed';
            $query->where('is_completed', $isCompleted);
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
            'assignee_email' => 'required|email|exists:users,email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Find assignee by email
        $assignee = User::where('email', $request->assignee_email)->first();

        if (!$assignee) {
            return response()->json([
                'success' => false,
                'message' => 'Assignee not found'
            ], 404);
        }

        $task = Task::create([
            'creator_id' => Auth::id(),
            'assignee_id' => $assignee->id,
            'title' => $request->title,
            'description' => $request->description,
            'due_date' => $request->due_date,
            'priority' => $request->priority,
            'is_completed' => false
        ]);

        $task->load(['creator:id,name,email', 'assignee:id,name,email']);

        event(new Tasks($assignee->id, "New Task Created"));
        TaskAssigned::dispatch($task);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $task
        ], 201);
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

        // Check if user is the assignee
        if ($task->assignee_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only the assignee can update this task.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'sometimes|required|date',
            'priority' => ['sometimes', 'required', Rule::in(['low', 'medium', 'high'])],
            'is_completed' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $task->update($request->only([
            'title',
            'description',
            'due_date',
            'priority',
            'is_completed'
        ]));

        $task->load(['creator:id,name,email', 'assignee:id,name,email']);


        event(new Tasks($task->assignee_id, "Task Updated . "));

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


        $taskId = $task->id;
        $assigneeId = $task->assignee_id;
        $creatorId = $task->creator_id;


        event(new Tasks($task->assignee_id, "Task deleted . "));
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

        event(new Tasks($task->assignee_id, "You have a new Task . "));
        TaskAssigned::dispatch($task);

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

        $task->update([
            'is_completed' => !$task->is_completed
        ]);

        $task->load(['creator:id,name,email', 'assignee:id,name,email']);

        return response()->json([
            'success' => true,
            'message' => $task->is_completed ? 'Task marked as completed' : 'Task marked as incomplete',
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
        if ($request->has('status')) {
            $isCompleted = $request->status === 'completed';
            $query->where('is_completed', $isCompleted);
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
