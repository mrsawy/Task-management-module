import { useMemo, useState, useRef, useEffect } from 'react';
import {
    Kanban,
    KanbanBoard,
    KanbanColumn,
    KanbanItem,
    KanbanOverlay,
} from '@/components/atoms/kanban';
import { Card, CardContent } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import { AlertCircle, Plus, CheckCircle2, Circle, Flag, Calendar, User } from 'lucide-react';
import type { Task } from '@/lib/types/task.interface';
import { getPriorityColor, getWorkflowStatusLabel } from '@/lib/utils/statusComputer';
import { getRelativeTime } from '@/lib/utils/dateUtils';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import TaskForm from './TaskForm';
import TaskView from './TaskView';
import { toast } from 'sonner';
import { useUpdateTaskMutation } from '@/services/taskApi';
import type { UniqueIdentifier } from '@dnd-kit/core';

type TaskWorkflowStatus = 'to-do' | 'in-progress' | 'review' | 'done';

interface TasksKanbanProps {
    tasksData?: {
        data: Task[];
        success: boolean;
    };
    isLoading: boolean;
    error: FetchBaseQueryError | SerializedError | undefined;
    listeningToUpdates?: boolean;
}

export default function TasksKanban({
    tasksData,
    isLoading,
    error,
    listeningToUpdates = false,
}: TasksKanbanProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [updateTask] = useUpdateTaskMutation();

    // Ensure tasks is always an array
    const tasks = Array.isArray(tasksData?.data) ? tasksData.data : [];

    // Organize tasks by workflow status
    const kanbanData = useMemo(() => {
        const columns: Record<TaskWorkflowStatus, Task[]> = {
            'to-do': [],
            'in-progress': [],
            'review': [],
            'done': [],
        };

        tasks.forEach((task) => {
            const status = (task.status || 'to-do') as TaskWorkflowStatus;
            if (columns[status]) {
                columns[status].push(task);
            }
        });

        return columns;
    }, [tasks]);

    // Convert to format expected by Kanban component
    const baseKanbanValue = useMemo(() => {
        return {
            'to-do': kanbanData['to-do'],
            'in-progress': kanbanData['in-progress'],
            'review': kanbanData['review'],
            'done': kanbanData['done'],
        };
    }, [kanbanData]);

    // Use local state for kanban value to prevent re-renders during drag
    const [kanbanValue, setKanbanValue] = useState<Record<UniqueIdentifier, Task[]>>(baseKanbanValue);
    const isDraggingRef = useRef(false);
    const pendingUpdateRef = useRef<Record<UniqueIdentifier, Task[]> | null>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipSyncRef = useRef(false);

    // Sync local state with query data when not dragging
    useEffect(() => {
        if (!isDraggingRef.current && !skipSyncRef.current) {
            setKanbanValue(baseKanbanValue);
        }
    }, [baseKanbanValue]);

    // Store the state at the start of a drag operation
    const dragStartStateRef = useRef<Record<UniqueIdentifier, Task[]>>(kanbanValue);

    // Create a map of task ID to its current column
    const getTaskColumnMap = (columns: Record<UniqueIdentifier, Task[]>) => {
        const map = new Map<number, string>();
        for (const [columnId, tasksInColumn] of Object.entries(columns)) {
            for (const task of tasksInColumn) {
                map.set(task.id, columnId as string);
            }
        }
        return map;
    };

    const handleDragStart = (event?: any) => {
        // Check if the drag started from a button click
        if (event?.activatorEvent) {
            const activatorEvent = event.activatorEvent;
            const target = (activatorEvent.target || activatorEvent.srcElement) as HTMLElement;

            if (target) {
                // Check if the click originated from a button or within a button
                const isButton = target.tagName === 'BUTTON' ||
                    target.closest('button') !== null ||
                    target.closest('[role="button"]') !== null ||
                    target.closest('[data-no-drag]') !== null;

                if (isButton) {
                    // Prevent drag if clicking on a button
                    if (activatorEvent.preventDefault) {
                        activatorEvent.preventDefault();
                    }
                    if (activatorEvent.stopPropagation) {
                        activatorEvent.stopPropagation();
                    }
                    return;
                }
            }
        }

        isDraggingRef.current = true;
        skipSyncRef.current = true;
        // Capture the state at drag start
        dragStartStateRef.current = { ...kanbanValue };
    };

    const handleDragEnd = async () => {
        // Clear any pending timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = null;
        }

        // Mark that we're no longer dragging
        isDraggingRef.current = false;

        // Process any pending updates
        if (pendingUpdateRef.current) {
            const columnsToCheck = pendingUpdateRef.current;
            pendingUpdateRef.current = null;

            // Get current and previous column mappings
            const currentMap = getTaskColumnMap(columnsToCheck);
            const previousMap = getTaskColumnMap(dragStartStateRef.current);

            // Find tasks that changed columns
            const tasksToUpdate: Array<{ task: Task; newStatus: TaskWorkflowStatus }> = [];

            // Get all tasks from the current kanban value (includes local updates)
            const allTasksInKanban = Object.values(columnsToCheck).flat();

            for (const [taskId, newColumn] of currentMap.entries()) {
                const oldColumn = previousMap.get(taskId);
                if (oldColumn && oldColumn !== newColumn) {
                    // Try to find task in local kanban value first, then fallback to query data
                    const task = allTasksInKanban.find((t) => t.id === taskId) || tasks.find((t) => t.id === taskId);
                    if (task) {
                        tasksToUpdate.push({
                            task,
                            newStatus: newColumn as TaskWorkflowStatus
                        });
                    }
                }
            }

            // Update all tasks that changed status
            // Optimistic updates are handled by onQueryStarted in the mutation
            if (tasksToUpdate.length > 0) {
                const updatePromises = tasksToUpdate.map(async ({ task, newStatus }) => {
                    try {
                        await updateTask({
                            id: task.id,
                            status: newStatus,
                        }).unwrap();
                        return { success: true, taskId: task.id };
                    } catch (error: any) {
                        console.error('Failed to update task:', error);
                        const errorMessage = error?.data?.message || error?.message || 'Failed to update task status';
                        toast.error(errorMessage);
                        // Return failure info for rollback
                        return { success: false, taskId: task.id, task, oldStatus: previousMap.get(task.id) };
                    }
                });

                const results = await Promise.all(updatePromises);

                // Check if any updates failed
                const failedUpdates = results.filter(r => !r.success);

                if (failedUpdates.length > 0) {
                    // Revert failed tasks in local state
                    setKanbanValue(prev => {
                        const reverted = { ...prev };

                        failedUpdates.forEach(({ taskId, task, oldStatus }) => {
                            if (oldStatus) {
                                // Find the original task from drag start state
                                const originalTask = Object.values(dragStartStateRef.current)
                                    .flat()
                                    .find(t => t.id === taskId);

                                if (originalTask) {
                                    // Remove from current (failed) column
                                    const currentStatus = (task.status || 'to-do') as TaskWorkflowStatus;
                                    if (reverted[currentStatus]) {
                                        reverted[currentStatus] = reverted[currentStatus].filter(t => t.id !== taskId);
                                    }

                                    // Add back to old column with original status
                                    const oldStatusTyped = oldStatus as TaskWorkflowStatus;
                                    if (reverted[oldStatusTyped]) {
                                        reverted[oldStatusTyped] = [...reverted[oldStatusTyped], originalTask];
                                    }
                                }
                            }
                        });

                        return reverted;
                    });
                }

                // Allow sync again after a short delay to let optimistic updates settle
                setTimeout(() => {
                    skipSyncRef.current = false;
                }, 200);
            } else {
                skipSyncRef.current = false;
            }
        } else {
            skipSyncRef.current = false;
        }
    };

    const handleValueChange = (columns: Record<UniqueIdentifier, Task[]>) => {
        // Update local state immediately for smooth drag experience
        setKanbanValue(columns);

        if (!isDraggingRef.current) {
            // Not dragging, just update the reference
            dragStartStateRef.current = { ...columns };
            return;
        }

        // Store the pending update
        pendingUpdateRef.current = columns;

        // Clear any existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Wait for drag to end (debounce)
        updateTimeoutRef.current = setTimeout(() => {
            handleDragEnd();
        }, 150);
    };

    const handleMove = () => {
        // This is called for same-column reordering or column reordering
        // Task movement between columns is handled in onValueChange
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setShowForm(true);
    };

    const handleViewTask = (task: Task) => {
        setViewingTask(task);
        setViewOpen(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTask(null);
    };

    const getColumnTitle = (status: TaskWorkflowStatus): string => {
        return getWorkflowStatusLabel(status);
    };

    const getColumnColor = (status: TaskWorkflowStatus): string => {
        const colors = {
            'to-do': 'border-gray-200 bg-gray-50/50',
            'in-progress': 'border-blue-200 bg-blue-50/50',
            'review': 'border-yellow-200 bg-yellow-50/50',
            'done': 'border-green-200 bg-green-50/50',
        };
        return colors[status] || '';
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex gap-4">
                    {(['to-do', 'in-progress', 'review', 'done'] as TaskWorkflowStatus[]).map((_, i) => (
                        <div key={i} className="flex-1">
                            <Skeleton className="h-96 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Failed to load tasks</h3>
                    <p className="text-muted-foreground mb-4">
                        There was an error loading your tasks. Please try again later.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 container">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tasks Kanban</h1>
                    <p className="text-muted-foreground">
                        Drag and drop tasks to update their status
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Task
                </Button>
            </div>

            {/* Kanban Board */}
            <div className="w-full overflow-x-auto">
                <Kanban
                    value={kanbanValue}
                    onValueChange={handleValueChange}
                    onMove={handleMove}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    getItemValue={(item) => item.id}
                    orientation="horizontal"
                >
                    <KanbanBoard>
                        {(['to-do', 'in-progress', 'review', 'done'] as TaskWorkflowStatus[]).map((status) => (
                            <KanbanColumn key={status} value={status}>
                                <div className={`p-3 border-b ${getColumnColor(status)}`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm">
                                            {getColumnTitle(status)}
                                        </h3>
                                        <Badge variant="outline" className="text-xs">
                                            {kanbanValue[status]?.length || 0}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-2 space-y-2 min-h-[400px]">
                                    {kanbanValue[status]?.map((task) => (
                                        <KanbanItem key={task.id} value={task.id} asHandle>
                                            <Card className="cursor-grab active:cursor-grabbing">
                                                <CardContent className="p-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-medium text-sm leading-tight line-clamp-2">
                                                                {task.title}
                                                            </h4>
                                                            {task.status === 'done' ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                            ) : (
                                                                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                            )}
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs ${getPriorityColor(task.priority)}`}
                                                            >
                                                                <Flag className="mr-1 h-3 w-3" />
                                                                {task.priority}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            <div className="flex items-center">
                                                                <Calendar className="mr-1 h-3 w-3" />
                                                                <span>{getRelativeTime(task.due_date)}</span>
                                                            </div>
                                                            {task.assignee && (
                                                                <div className="flex items-center">
                                                                    <User className="mr-1 h-3 w-3" />
                                                                    <span className="truncate">{task.assignee.name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div
                                                            className="flex gap-1 pt-1"
                                                            data-no-drag
                                                            onPointerDown={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                            }}
                                                            onTouchStart={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                            }}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs flex-1"
                                                                data-no-drag
                                                                type="button"
                                                                onPointerDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                }}
                                                                onTouchStart={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewTask(task);
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs flex-1"
                                                                data-no-drag
                                                                type="button"
                                                                onPointerDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                }}
                                                                onTouchStart={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditTask(task);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </KanbanItem>
                                    ))}
                                    {(!kanbanValue[status] || kanbanValue[status].length === 0) && (
                                        <div className="text-center text-sm text-muted-foreground py-8">
                                            No tasks
                                        </div>
                                    )}
                                </div>
                            </KanbanColumn>
                        ))}
                    </KanbanBoard>
                    <KanbanOverlay>
                        {({ value, variant }) => {
                            const task = tasks.find((t) => t.id === value);
                            if (!task || variant !== 'item') return null;
                            return (
                                <Card className="w-64 opacity-90">
                                    <CardContent className="p-3">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">{task.title}</h4>
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${getPriorityColor(task.priority)}`}
                                            >
                                                {task.priority}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }}
                    </KanbanOverlay>
                </Kanban>
            </div>

            {/* Task Form Modal */}
            <TaskForm
                open={showForm}
                onOpenChange={handleCloseForm}
                task={editingTask}
                onSuccess={() => {
                    listeningToUpdates && toast.success(`Task ${editingTask ? 'updated' : 'created'} successfully`);
                }}
            />

            {/* Task View Modal */}
            <TaskView
                open={viewOpen}
                onOpenChange={setViewOpen}
                task={viewingTask}
                onEdit={handleEditTask}
            />
        </div>
    );
}
