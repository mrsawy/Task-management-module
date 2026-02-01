import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
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
import { useCreateUserMutation, useUpdateUserMutation, useGetRolesQuery } from '@/services/userApi';
import { userSchema, type UserFormData } from '@/lib/schema/user.schema';
import type { User } from '@/lib/types/auth.interface';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
}

export default function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
  // Fetch roles
  const { data: rolesData } = useGetRolesQuery();
  const roles = rolesData?.data || [];

  const isLoading = isCreating || isUpdating;
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role_id: 1,
    },
  });

  const role_id = watch('role_id');

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('role_id', user.role_id || 1);
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role_id: 1,
      });
    }
  }, [user, setValue, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && user) {
        // Remove password if not provided
        const updateData: any = {
          id: user.id,
          name: data.name,
          email: data.email,
          role_id: data.role_id,
        };
        if (data.password) {
          updateData.password = data.password;
        }
        await updateUser(updateData).unwrap();
        toast.success('User updated successfully');
      } else {
        if (!data.password) {
          toast.error('Password is required for new users');
          return;
        }
        await createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role_id: data.role_id,
        }).unwrap();
        toast.success('User created successfully');
      }

      onOpenChange(false);
      onSuccess?.();
      reset();
    } catch (error: any) {
      const message =
        error?.data?.message ||
        `Failed to ${isEditing ? 'update' : 'create'} user`;
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update user information and role.'
              : 'Add a new user to the system. Assign them a role to set their permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="John Doe"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john@example.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {isEditing && '(leave empty to keep current)'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={isEditing ? 'Enter new password' : 'Enter password'}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_id">Role</Label>
            <Select
              value={role_id?.toString()}
              onValueChange={(value) => setValue('role_id', parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role_id && (
              <p className="text-sm text-destructive">{errors.role_id.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
