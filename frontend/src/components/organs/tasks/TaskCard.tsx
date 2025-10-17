import { Card, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Checkbox } from '@/components/atoms/checkbox';
import {  DropdownMenu,  DropdownMenuContent,  DropdownMenuItem,  DropdownMenuTrigger,} from '@/components/atoms/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, User, Calendar, Flag, CheckCircle2, Circle, OctagonAlert, Loader2, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteTaskMutation, useToggleCompleteMutation } from '@/services/taskApi';
import { getPriorityColor, getStatusColor, getStatusLabel, getTaskStatus } from '@/lib/utils/statusComputer';
import { formatDate, getRelativeTime } from '@/lib/utils/dateUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/atoms/alert-dialog';
import type { Task } from '@/lib/types/task.interface';
import { useState } from 'react';
import { useMeQuery } from '@/services/authApi';
import TaskView from './TaskView';
import TaskReassignForm from './TaskReassignForm';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [reassignOpen, setReassignOpen] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(!!task.is_completed);
  const [toggleComplete] = useToggleCompleteMutation();
  const [deleteTask, { isLoading }] = useDeleteTaskMutation();
  const { data: user } = useMeQuery();

  const status = getTaskStatus({ ...task, is_completed: isCompleted });
  const statusColor = getStatusColor(status);
  const priorityColor = getPriorityColor(task.priority);

  // Permission checks
  const isCreator = user?.id === task.creator_id;
  const isAssignee = user?.id === task.assignee?.id;


  const handleToggleComplete = async () => {
    if (!isAssignee) {
      toast.error('Only the assignee can mark tasks as complete');
      return;
    }

    try {
      setIsCompleted(p => !p);
      await toggleComplete(task.id).unwrap();
      toast.success(task.is_completed ? 'Task marked as incomplete' : 'Task completed!');
    } catch (error) {
      console.error({ error });
      setIsCompleted(p => !p);
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id).unwrap();
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    } finally {
      setOpen(false);
    }
  };

  const handleCardClick = () => {
    if (isAssignee) {
      setViewOpen(true);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div
              className={`flex items-start space-x-3 flex-1 ${isAssignee ? 'cursor-pointer' : ''}`}
              onClick={handleCardClick}
            >
              <Checkbox
                id={`toggle-${task.id}`}
                onCheckedChange={handleToggleComplete}
                checked={isCompleted}
                disabled={!isAssignee}
                className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-sm leading-5 ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0  ">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 flex flex-col gap-1 p-2 text-sm">
                {/* View button - only for assignees */}
                {isAssignee && (
                  <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1">
                    <DropdownMenuItem onClick={() => setViewOpen(true)} className='cursor-pointer text-xs'>
                      <Eye className="mr-2 h-4 w-4 text-blue-500" />
                      View
                    </DropdownMenuItem>
                  </Button>
                )}

                {/* Edit button - only for assignees */}
                {isAssignee && (
                  <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1 r">
                    <DropdownMenuItem className='cursor-pointer text-xs' onClick={() => onEdit?.(task)}>
                      <Edit className="mr-2 h-4 w-4 text-green-500" />
                      Edit
                    </DropdownMenuItem>
                  </Button>
                )}

                {/* Reassign button - only for creators who are not assignees */}
                {isCreator && (
                  <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1 ">
                    <DropdownMenuItem className='cursor-pointer text-xs' onClick={() => setReassignOpen(true)} >
                      <UserPlus className="mr-2 h-4 w-4 text-purple-500" />
                      Reassign
                    </DropdownMenuItem>
                  </Button>
                )}

                {/* Delete button - only for creators */}

                <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1 " onClick={() => setOpen(true)}>
                  <DropdownMenuItem className='cursor-pointer text-xs text-destructive' asChild >
                    <>
                      <Trash2 className="mx-2 h-4 w-4 text-red-500" />
                      Delete
                    </>
                  </DropdownMenuItem>
                </Button>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={`text-xs ${statusColor}`}>
              {task.is_completed ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : (
                <Circle className="mr-1 h-3 w-3" />
              )}
              {getStatusLabel(status)}
            </Badge>

            <Badge variant="outline" className={`text-xs ${priorityColor}`}>
              <Flag className="mr-1 h-3 w-3" />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-3 w-3" />
              <span>Due: {getRelativeTime(task.due_date)}</span>
              <span className="ml-2 text-muted-foreground/70">
                ({formatDate(task.due_date)})
              </span>
            </div>

            {task.assignee && (
              <div className="flex items-center">
                <User className="mr-2 h-3 w-3" />
                <span>Assigned to: {task.assignee.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* delete alert */}
      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex gap-4 flex-nowrap items-center pb-6">
              <OctagonAlert className="size-7 text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Task View Modal */}
      <TaskView
        open={viewOpen}
        onOpenChange={setViewOpen}
        task={task}
      />

      {/* Task Reassign Modal */}
      <TaskReassignForm
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        task={task}
      />
    </>
  );
}