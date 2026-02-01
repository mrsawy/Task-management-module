import z from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['to-do', 'in-progress', 'review', 'done']).optional(),
  assignee_id: z.number().min(1, 'Please select an assignee'),
  dependency_ids: z.array(z.number()).optional(),
  dependent_ids: z.array(z.number()).optional()
});

export type TaskFormData = z.infer<typeof taskSchema>;

