import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Textarea } from '@/components/atoms/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { Checkbox } from '@/components/atoms/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateTaskMutation, useUpdateTaskMutation, useGetTasksQuery } from '@/services/taskApi';
import { useGetUsersQuery } from '@/services/userApi';
import { taskSchema, type TaskFormData } from '@/lib/schema/task.schema';
import type { Task } from '@/lib/types/task.interface';
import { DatePicker } from '@/components/molecules/Calender';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSuccess?: () => void;
}

export default function TaskForm({ open, onOpenChange, task, onSuccess }: TaskFormProps) {
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useGetUsersQuery();
  const { data: tasksData, isLoading: isLoadingTasks } = useGetTasksQuery();
  const [dependenciesOpen, setDependenciesOpen] = useState(false);
  const [dependentsOpen, setDependentsOpen] = useState(false);

  const isLoading = isCreating || isUpdating;
  const isEditing = !!task;
  const users = usersData?.data || [];
  const allTasks = tasksData?.data || [];

  // Filter out current task from available tasks when editing
  const availableTasks = isEditing
    ? allTasks.filter(t => t.id !== task?.id)
    : allTasks;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      status: 'to-do',
      dependency_ids: [],
      dependent_ids: [],
    },
  });

  const priority = watch('priority');
  const status = watch('status');
  const due_date = watch('due_date');
  const assignee_id = watch('assignee_id');
  const dependency_ids = watch('dependency_ids') || [];
  const dependent_ids = watch('dependent_ids') || [];

  useEffect(() => {
    if (task) {
      setValue('title', task.title);
      setValue('description', task.description || '');
      setValue('due_date', task.due_date.split('T')[0]); // format date
      setValue('priority', task.priority);
      setValue('status', task.status || 'to-do');
      setValue('assignee_id', task.assignee_id);
      setValue('dependency_ids', task.dependencies?.map(d => d.id) || []);
      setValue('dependent_ids', task.dependents?.map(d => d.id) || []);
    } else {
      reset({
        title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        status: 'to-do',
        assignee_id: undefined,
        dependency_ids: [],
        dependent_ids: [],
      });
    }
  }, [task, setValue, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      const submitData = {
        ...data,
        dependency_ids: data.dependency_ids || [],
        dependent_ids: data.dependent_ids || [],
      };

      if (isEditing && task) {
        await updateTask({
          id: task.id,
          ...submitData,
        }).unwrap();
        toast.success('Task Updated successfully');
      } else {
        await createTask(submitData).unwrap();
        toast.success('Task created successfully');
      }

      onOpenChange(false);
      onSuccess?.();
      reset();
    } catch (error: any) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        `Failed to ${isEditing ? 'update' : 'create'} task`;
      try {
        console.error({ error })
        const errors: any = Object.values(error?.data?.errors);
        errors.forEach((ele: any) => {
          if (Array.isArray(ele)) {
            ele.forEach(err => toast.error(err))
          }
        });
        console.log({ errors })
        if (errors) return
        toast.error(message);
      } catch {
        toast.error(message);

      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  // const { data: user } = useMeQuery();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register('title')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description (optional)"
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date *</Label>
            {/* <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              className={errors.due_date ? 'border-destructive' : ''}
            /> */}
            <DatePicker defaultValue={new Date(due_date)} onChange={(date) => setValue('due_date', date.toISOString().split('T')[0])} />
            {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setValue('priority', value as 'low' | 'medium' | 'high')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status - Only for managers or when editing */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status || 'to-do'}
                onValueChange={(value) => setValue('status', value as 'to-do' | 'in-progress' | 'review' | 'done')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to-do">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>
          )}

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee_id">Assignee *</Label>
            {usersError ? (
              <div className="text-sm text-destructive">
                Failed to load users. Please refresh the page.
              </div>
            ) : (
              <Select
                value={assignee_id?.toString()}
                onValueChange={(value) => setValue('assignee_id', parseInt(value))}
                disabled={isEditing || isLoadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select an assignee"} />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 && !isLoadingUsers ? (
                    <SelectItem value="" disabled>No users available</SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.assignee_id && (
              <p className="text-sm text-destructive">{errors.assignee_id.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select the user you want to assign this task to.
            </p>
          </div>

          {/* Dependencies - Tasks this task depends on */}
          <div className="space-y-2">
            <Label htmlFor="dependency_ids">Dependencies</Label>
            <Popover open={dependenciesOpen} onOpenChange={setDependenciesOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    errors.dependency_ids && "border-destructive"
                  )}
                  disabled={isLoadingTasks}
                >
                  {dependency_ids.length > 0
                    ? `${dependency_ids.length} task${dependency_ids.length > 1 ? 's' : ''} selected`
                    : "Select tasks this task depends on"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-60 overflow-auto p-2">
                  {isLoadingTasks ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading tasks...</span>
                    </div>
                  ) : availableTasks.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No tasks available</div>
                  ) : (
                    <div className="space-y-2">
                      {availableTasks.map((availableTask) => {
                        const isSelected = dependency_ids.includes(availableTask.id);
                        return (
                          <div
                            key={availableTask.id}
                            className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              const newIds = isSelected
                                ? dependency_ids.filter(id => id !== availableTask.id)
                                : [...dependency_ids, availableTask.id];
                              setValue('dependency_ids', newIds);
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const newIds = checked
                                  ? [...dependency_ids, availableTask.id]
                                  : dependency_ids.filter(id => id !== availableTask.id);
                                setValue('dependency_ids', newIds);
                              }}
                            />
                            <Label className="flex-1 cursor-pointer">
                              {availableTask.title}
                              {availableTask.is_completed && (
                                <span className="ml-2 text-xs text-muted-foreground">(Completed)</span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {errors.dependency_ids && (
              <p className="text-sm text-destructive">{errors.dependency_ids.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select tasks that must be completed before this task can be completed.
            </p>
          </div>

          {/* Dependents - Tasks that depend on this task */}
          <div className="space-y-2">
            <Label htmlFor="dependent_ids">Dependents</Label>
            <Popover open={dependentsOpen} onOpenChange={setDependentsOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    errors.dependent_ids && "border-destructive"
                  )}
                  disabled={isLoadingTasks}
                >
                  {dependent_ids.length > 0
                    ? `${dependent_ids.length} task${dependent_ids.length > 1 ? 's' : ''} selected`
                    : "Select tasks that depend on this task"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-60 overflow-auto p-2">
                  {isLoadingTasks ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading tasks...</span>
                    </div>
                  ) : availableTasks.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No tasks available</div>
                  ) : (
                    <div className="space-y-2">
                      {availableTasks.map((availableTask) => {
                        const isSelected = dependent_ids.includes(availableTask.id);
                        return (
                          <div
                            key={availableTask.id}
                            className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              const newIds = isSelected
                                ? dependent_ids.filter(id => id !== availableTask.id)
                                : [...dependent_ids, availableTask.id];
                              setValue('dependent_ids', newIds);
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const newIds = checked
                                  ? [...dependent_ids, availableTask.id]
                                  : dependent_ids.filter(id => id !== availableTask.id);
                                setValue('dependent_ids', newIds);
                              }}
                            />
                            <Label className="flex-1 cursor-pointer">
                              {availableTask.title}
                              {availableTask.is_completed && (
                                <span className="ml-2 text-xs text-muted-foreground">(Completed)</span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {errors.dependent_ids && (
              <p className="text-sm text-destructive">{errors.dependent_ids.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select tasks that will depend on this task being completed.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
