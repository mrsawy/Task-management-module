import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Loader2, Info, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useReassignTaskMutation } from '@/services/taskApi';
import type { Task } from '@/lib/types/task.interface';
import { Alert, AlertDescription } from '@/components/atoms/alert';

const reassignSchema = z.object({
    assignee_email: z.string().email('Please enter a valid email address'),
});

type ReassignFormData = z.infer<typeof reassignSchema>;

interface TaskReassignFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    onSuccess?: () => void;
}

export default function TaskReassignForm({ open, onOpenChange, task, onSuccess }: TaskReassignFormProps) {

    const [reassign, { isLoading }] = useReassignTaskMutation()
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<ReassignFormData>({
        resolver: zodResolver(reassignSchema),
    });

    useEffect(() => {
        if (task) {
            setValue('assignee_email', task.assignee?.email || '');
        } else {
            reset();
        }
    }, [task, setValue, reset]);

    const onSubmit = async (data: ReassignFormData) => {
        if (!task) return;

        try {
            await reassign({
                id: task.id,
                assignee_email: data.assignee_email,
            }).unwrap();

            toast.success('Task reassigned successfully');
            onOpenChange(false);
            onSuccess?.();
            reset();
        } catch (error: any) {
            console.error({ error })
            const errors: any = Object.values(error?.data?.errors);
            errors.forEach((ele: any) => {
                if (Array.isArray(ele)) {
                    ele.forEach(err => toast.error(err))
                }
            });
            console.log({ errors })
            if (errors) return
            const message =
                (error as { data?: { message?: string } })?.data?.message ||
                'Failed to reassign task';
            toast.error(message);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-purple-500" />
                        Reassign Task
                    </DialogTitle>
                    <DialogDescription>
                        Change the assignee for "{task?.title}"
                    </DialogDescription>
                </DialogHeader>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        As the task creator, you can reassign this task to another user. Only the assignee can edit task details.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Current Assignee Info */}
                    {task?.assignee && (
                        <div className="rounded-lg border p-3 bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Current Assignee</p>
                            <p className="text-sm font-medium">{task.assignee.name}</p>
                            <p className="text-xs text-muted-foreground">{task.assignee.email}</p>
                        </div>
                    )}

                    {/* New Assignee Email */}
                    <div className="space-y-2">
                        <Label htmlFor="assignee_email">New Assignee Email *</Label>
                        <Input
                            id="assignee_email"
                            type="email"
                            placeholder="Enter new assignee's email"
                            {...register('assignee_email')}
                            className={errors.assignee_email ? 'border-destructive' : ''}
                        />
                        {errors.assignee_email && (
                            <p className="text-sm text-destructive">{errors.assignee_email.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            The task will be reassigned to the user with this email address.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reassign Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}