<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class ERPTaskController extends Controller {
    
    /**
     * Create procurement task
     */
    public function createProcurementTask(Request $request) {
        $validated = $request->validate([
            'po_id' => 'required|string',
            'po_amount' => 'nullable|numeric',
            'assignee_email' => 'required|email|exists:users,email',
            'procurement_type' => 'required|in:purchase,approval,delivery,inspection',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
        ]);

        $assignee = User::where('email', $validated['assignee_email'])->first();

        $task = Task::create([
            'creator_id' => $request->user()->id,
            'assignee_id' => $assignee->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'due_date' => $validated['due_date'],
            'priority' => 'high',
            'meta' => [
                'erp_type' => 'procurement',
                'erp_po_id' => $validated['po_id'],
                'erp_po_amount' => $validated['po_amount'],
                'procurement_type' => $validated['procurement_type'],
                'erp_context' => 'purchase_task',
            ],
        ]);

        return response()->json([
            'message' => 'Procurement task created',
            'task' => $task,
        ], 201);
    }

    /**
     * Create inventory management task
     */
    public function createInventoryTask(Request $request) {
        $validated = $request->validate([
            'inventory_id' => 'required|string',
            'inventory_name' => 'nullable|string',
            'quantity' => 'nullable|integer',
            'assignee_email' => 'required|email|exists:users,email',
            'title' => 'required|string',
            'due_date' => 'required|date',
        ]);

        $assignee = User::where('email', $validated['assignee_email'])->first();

        $task = Task::create([
            'creator_id' => $request->user()->id,
            'assignee_id' => $assignee->id,
            'title' => $validated['title'],
            'due_date' => $validated['due_date'],
            'priority' => 'medium',
            'meta' => [
                'erp_inventory_id' => $validated['inventory_id'],
                'erp_inventory_name' => $validated['inventory_name'],
                'erp_quantity' => $validated['quantity'],
                'erp_context' => 'inventory_task',
            ],
        ]);

        return response()->json([
            'message' => 'Inventory task created',
            'task' => $task,
        ], 201);
    }

    /**
     * Get procurement pipeline
     */
    public function getProcurementPipeline(Request $request) {
        $tasks = Task::where('meta->erp_type', 'procurement')
                     ->get();

        $byStatus = [
            'purchase' => $tasks->where('meta.procurement_type', 'purchase')->count(),
            'approval' => $tasks->where('meta.procurement_type', 'approval')->count(),
            'delivery' => $tasks->where('meta.procurement_type', 'delivery')->count(),
            'inspection' => $tasks->where('meta.procurement_type', 'inspection')->count(),
        ];

        $totalAmount = $tasks->sum('meta.erp_po_amount');
        $completedAmount = $tasks->where('is_completed', true)->sum('meta.erp_po_amount');

        return response()->json([
            'total_pos' => $tasks->count(),
            'by_status' => $byStatus,
            'total_amount' => $totalAmount,
            'completed_amount' => $completedAmount,
            'pending_amount' => $totalAmount - $completedAmount,
        ]);
    }

    /**
     * Get inventory stock status
     */
    public function getInventoryStockStatus(Request $request, string $inventoryId) {
        $tasks = Task::where('meta->erp_inventory_id', $inventoryId)
                     ->get();

        return response()->json([
            'inventory_id' => $inventoryId,
            'total_tasks' => $tasks->count(),
            'pending_tasks' => $tasks->where('is_completed', false)->count(),
            'completed_tasks' => $tasks->where('is_completed', true)->count(),
            'tasks' => $tasks,
        ]);
    }
}