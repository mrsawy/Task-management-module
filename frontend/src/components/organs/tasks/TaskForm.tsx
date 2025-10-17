import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Textarea } from '@/components/atoms/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/services/taskApi';
import { taskSchema, type TaskFormData } from '@/lib/schema/task.schema';
import type { Task } from '@/lib/types/task.interface';// ✅ Shadcn checkbox
import { DatePicker } from '@/components/molecules/Calender';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSuccess?: () => void;
}

export default function TaskForm({ open, onOpenChange, task, onSuccess }: TaskFormProps) {
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const isLoading = isCreating || isUpdating;
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData & { is_completed?: boolean }>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      is_completed: false,
    },
  });

  const priority = watch('priority');
  const is_completed = watch('is_completed');
  const due_date = watch('due_date');

  useEffect(() => {
    if (task) {
      setValue('title', task.title);
      setValue('description', task.description || '');
      setValue('due_date', task.due_date.split('T')[0]); // format date
      setValue('priority', task.priority);
      setValue('assignee_email', task.assignee?.email || '');
      setValue('is_completed', !!task.is_completed || false);
    } else {
      reset({
        title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        assignee_email: '',
        is_completed: false,
      });
    }
  }, [task, setValue, reset]);

  const onSubmit = async (data: TaskFormData & { is_completed?: boolean }) => {
    try {
      if (isEditing && task) {
        await updateTask({
          id: task.id,
          ...data,
          is_completed: is_completed || false,
        }).unwrap();
      } else {
        await createTask({
          ...data
        }).unwrap();
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
      <DialogContent className="sm:max-w-[425px]">
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

          {/* Assignee */}
          <div
            className={isEditing ? "cursor-no-drop space-y-2" : "space-y-2"}
          >
            <Label htmlFor="assignee_email">Assignee Email *</Label>
            <Input
              id="assignee_email"
              placeholder="Enter assignee user email"
              disabled={isEditing}
              {...register('assignee_email')}

            />
            {errors.assignee_email && (
              <p className="text-sm text-destructive">{errors.assignee_email.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the email of the person you want to assign this task to.
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
