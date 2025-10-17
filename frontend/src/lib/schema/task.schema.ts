import z from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']),
  assignee_email: z.email('Invalid email address')
});

export type TaskFormData = z.infer<typeof taskSchema>;

