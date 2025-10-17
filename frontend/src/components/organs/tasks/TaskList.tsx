import { useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Card, CardContent } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';
import { Plus, ListTodo, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getTaskStatus } from '@/lib/utils/statusComputer';
import type { Task } from '@/lib/types/task.interface';
import type { FilterState } from '@/components/organs/tasks/TaskFilters';
import TaskCard from '@/components/organs/tasks/TaskCard';
import TaskForm from '@/components/organs/tasks/TaskForm';
import TaskFilters from '@/components/organs/tasks/TaskFilters';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import { toast } from 'sonner';


export default function TasksList({ tasksData, isLoading, error, listeningToUpdates = false }: {
  tasksData?: {
    data: Task[];
    success: boolean;
  },
  isLoading: boolean,
  error: FetchBaseQueryError | SerializedError | undefined,
  listeningToUpdates?: boolean

}) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    sortBy: 'due_date',
  });

  // Ensure tasks is always an array
  const tasks = Array.isArray(tasksData?.data) ? tasksData.data : [];



  const filteredAndSortedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) {
      return [];
    }

    const filtered = tasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.assignee?.name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const taskStatus = getTaskStatus(task);
        if (taskStatus !== filters.status) return false;
      }

      // Priority filter
      if (filters.priority !== 'all') {
        if (task.priority !== filters.priority) return false;
      }

      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'due_date':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, filters]);

  const taskStats = useMemo(() => {
    if (!Array.isArray(tasks)) {
      return {
        total: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0,
      };
    }

    const stats = {
      total: tasks.length,
      completed: 0,
      overdue: 0,
      dueToday: 0,
    };

    tasks.forEach((task) => {
      const status = getTaskStatus(task);
      if (status === 'done') stats.completed++;
      if (status === 'missed') stats.overdue++;
      if (status === 'due_today') stats.dueToday++;
    });

    return stats;
  }, [tasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
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
          <p className="text-sm text-muted-foreground">
            Note: Make sure your backend API is running and accessible.
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
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track your tasks efficiently
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ListTodo className="mx-auto h-8 w-8 text-primary mb-2" />
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold">{taskStats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
            <div className="text-2xl font-bold">{taskStats.dueToday}</div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            <div className="text-2xl font-bold">{taskStats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {/* Task List */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className=' '>

          <Card>
            <CardContent className="p-12 text-center">
              <ListTodo className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {tasks.length === 0
                  ? 'Create your first task to get started with task management.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {tasks.length === 0 && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Task
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
          ))}
        </div>
      )}

      {/* Task Form Modal */}
      <TaskForm
        open={showForm}
        onOpenChange={handleCloseForm}
        task={editingTask}
        onSuccess={() => {
          listeningToUpdates && toast.success(`Task ${editingTask ? 'updated' : 'created'} successfully`);
        }}
      />
    </div>
  );
}