import z from "zod";

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role_id: z.number().min(1, 'Role is required'),
});

export type UserFormData = z.infer<typeof userSchema>;
