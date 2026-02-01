

import type { Task } from '../types/task.interface';
import { isDateToday, isDatePast } from './dateUtils';

export type TaskStatus = 'done' | 'missed' | 'due_today' | 'upcoming';
export type TaskWorkflowStatus = 'to-do' | 'in-progress' | 'review' | 'done';

export const getTaskStatus = (task: Task): TaskStatus => {
  if (task.status === 'done') return 'done';
  if (isDatePast(task.due_date)) return 'missed';
  if (isDateToday(task.due_date)) return 'due_today';
  return 'upcoming';
};

export const getWorkflowStatusColor = (status: TaskWorkflowStatus) => {
  switch (status) {
    case 'to-do':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'in-progress':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'review':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'done':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
};

export const getWorkflowStatusLabel = (status: TaskWorkflowStatus) => {
  switch (status) {
    case 'to-do':
      return 'To Do';
    case 'in-progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
    default:
      return 'Unknown';
  }
};

export const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'done':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'missed':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'due_today':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'upcoming':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
};

export const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'done':
      return 'Completed';
    case 'missed':
      return 'Overdue';
    case 'due_today':
      return 'Due Today';
    case 'upcoming':
      return 'Upcoming';
    default:
      return 'Unknown';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-muted-foreground bg-muted border-border';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
};