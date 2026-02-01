import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/atoms/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import {
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Circle,
  FileText,
  UserCircle,
  Clock,
  Link as LinkIcon,
  Loader2,
  MoreHorizontal,
  Eye,
  Edit
} from 'lucide-react';
import type { Task } from '@/lib/types/task.interface';
import { getPriorityColor, getWorkflowStatusColor, getWorkflowStatusLabel } from '@/lib/utils/statusComputer';
import { formatDate, getRelativeTime } from '@/lib/utils/dateUtils';
import { useGetTaskQuery } from '@/services/taskApi';
import { useState } from 'react';

interface TaskViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
}

export default function TaskView({ open, onOpenChange, task, onEdit }: TaskViewProps) {
  const { data: fullTaskData, isLoading: isLoadingTask } = useGetTaskQuery(task?.id ?? 0, {
    skip: !task?.id || !open,
  });
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Use full task data if available, otherwise fall back to passed task
  const displayTask = fullTaskData?.data ?? task;

  if (!displayTask) return null;

  const priorityColor = getPriorityColor(displayTask.priority);

  const handleViewTask = (taskToView: Task) => {
    setViewingTask(taskToView);
  };

  const handleCloseViewTask = () => {
    setViewingTask(null);
  };

  const renderTaskCard = (task: Task, isDependency: boolean = false) => {
    const taskPriorityColor = getPriorityColor(task.priority);

    return (
      <div key={task.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-sm">{task.title}</h4>
              {task.status === 'done' && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 flex flex-col gap-1 p-2 text-sm">
              <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1">
                <DropdownMenuItem 
                  onClick={() => handleViewTask(task)} 
                  className="cursor-pointer text-xs"
                >
                  <Eye className="mr-2 h-4 w-4 text-blue-500" />
                  View
                </DropdownMenuItem>
              </Button>
              {onEdit && (
                <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1">
                  <DropdownMenuItem 
                    onClick={() => {
                      onEdit(task);
                      onOpenChange(false);
                    }} 
                    className="cursor-pointer text-xs"
                  >
                    <Edit className="mr-2 h-4 w-4 text-green-500" />
                    Edit
                  </DropdownMenuItem>
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`text-xs ${getWorkflowStatusColor(task.status)}`}>
            {task.status === 'done' ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : (
              <Circle className="mr-1 h-3 w-3" />
            )}
            {getWorkflowStatusLabel(task.status)}
          </Badge>
          <Badge variant="outline" className={`text-xs ${taskPriorityColor}`}>
            <Flag className="mr-1 h-3 w-3" />
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            Due: {formatDate(task.due_date)}
          </div>
          {task.assignee && (
            <div className="flex items-center">
              <User className="mr-1 h-3 w-3" />
              {task.assignee.name}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{displayTask.title}</DialogTitle>
          <DialogDescription>Task Details</DialogDescription>
        </DialogHeader>

        {isLoadingTask ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Status and Priority Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className={`text-sm px-3 py-1 ${getWorkflowStatusColor(displayTask.status)}`}>
                {displayTask.status === 'done' ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : (
                  <Circle className="mr-2 h-4 w-4" />
                )}
                {getWorkflowStatusLabel(displayTask.status)}
              </Badge>

              <Badge variant="outline" className={`text-sm px-3 py-1 ${priorityColor}`}>
                <Flag className="mr-2 h-4 w-4" />
                {displayTask.priority.charAt(0).toUpperCase() + displayTask.priority.slice(1)} Priority
              </Badge>
            </div>

            {/* Description */}
            {displayTask.description && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-semibold text-foreground">
                  <FileText className="mr-2 h-4 w-4" />
                  Description
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {displayTask.description}
                </p>
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Due Date
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-sm text-muted-foreground">
                  {formatDate(displayTask.due_date)}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {getRelativeTime(displayTask.due_date)}
                </p>
              </div>
            </div>

            {/* Assignee */}
            {displayTask.assignee && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-semibold text-foreground">
                  <User className="mr-2 h-4 w-4" />
                  Assignee
                </div>
                <div className="pl-6 flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {displayTask.assignee.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {displayTask.assignee.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dependencies Accordion */}
            {displayTask.dependencies && displayTask.dependencies.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-semibold text-foreground">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Dependencies
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="dependencies">
                    <AccordionTrigger className="text-sm">
                      {displayTask.dependencies.length} task{displayTask.dependencies.length !== 1 ? 's' : ''} this task depends on
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {displayTask.dependencies.map((dependency) => renderTaskCard(dependency, true))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Dependents Accordion */}
            {displayTask.dependents && displayTask.dependents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-semibold text-foreground">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Dependents
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="dependents">
                    <AccordionTrigger className="text-sm">
                      {displayTask.dependents.length} task{displayTask.dependents.length !== 1 ? 's' : ''} depend{displayTask.dependents.length === 1 ? 's' : ''} on this task
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {displayTask.dependents.map((dependent) => renderTaskCard(dependent))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Created At */}
            {displayTask.created_at && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-semibold text-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Created
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {formatDate(displayTask.created_at)}
                </p>
              </div>
            )}

            {/* Completion Status */}
            {!!(displayTask.status === 'done' && displayTask.updated_at) && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-semibold text-green-600">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {formatDate(displayTask.updated_at)}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      {/* View Dependency/Dependent Task Modal */}
      {viewingTask && (
        <TaskView
          open={!!viewingTask}
          onOpenChange={handleCloseViewTask}
          task={viewingTask}
          onEdit={onEdit}
        />
      )}
    </Dialog>
  );
}