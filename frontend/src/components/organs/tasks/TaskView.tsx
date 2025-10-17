import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { Badge } from '@/components/atoms/badge';
import {
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Circle,
  FileText,
  UserCircle,
  Clock
} from 'lucide-react';
import type { Task } from '@/lib/types/task.interface';
import { getPriorityColor, getStatusColor, getStatusLabel, getTaskStatus } from '@/lib/utils/statusComputer';
import { formatDate, getRelativeTime } from '@/lib/utils/dateUtils';

interface TaskViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export default function TaskView({ open, onOpenChange, task }: TaskViewProps) {
  if (!task) return null;

  const status = getTaskStatus(task);
  const statusColor = getStatusColor(status);
  const priorityColor = getPriorityColor(task.priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{task.title}</DialogTitle>
          <DialogDescription>Task Details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className={`text-sm px-3 py-1 ${statusColor}`}>
              {task.is_completed ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <Circle className="mr-2 h-4 w-4" />
              )}
              {getStatusLabel(status)}
            </Badge>

            <Badge variant="outline" className={`text-sm px-3 py-1 ${priorityColor}`}>
              <Flag className="mr-2 h-4 w-4" />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-foreground">
                <FileText className="mr-2 h-4 w-4" />
                Description
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {task.description}
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
                {formatDate(task.due_date)}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {getRelativeTime(task.due_date)}
              </p>
            </div>
          </div>

          {/* Assignee */}
          {task.assignee && (
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
                    {task.assignee.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.assignee.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Created At */}
          {task.created_at && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-foreground">
                <Clock className="mr-2 h-4 w-4" />
                Created
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {formatDate(task.created_at)}
              </p>
            </div>
          )}

          {/* Completion Status */}
          {!!(task.is_completed && task.updated_at) && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-green-600">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completed
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {formatDate(task.updated_at)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}