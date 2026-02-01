import { Card, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Mail, User as UserIcon, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteUserMutation } from '@/services/userApi';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/atoms/alert-dialog';
import type { User } from '@/lib/types/auth.interface';
import { useState } from 'react';
import { useMeQuery } from '@/services/authApi';
import UserView from './UserView';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

export default function UserCard({ user, onEdit }: UserCardProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [deleteUser, { isLoading }] = useDeleteUserMutation();
  const { data: currentUser } = useMeQuery();

  const isCurrentUser = currentUser?.id === user.id;
  const roleName = user.role?.name || 'No Role';

  const handleDelete = async () => {
    try {
      await deleteUser(user.id).unwrap();
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete user');
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 cursor-pointer" onClick={() => setViewOpen(true)}>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm leading-5 text-foreground">
                  {user.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 flex flex-col gap-1 p-2 text-sm">
                <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1">
                  <DropdownMenuItem onClick={() => setViewOpen(true)} className="cursor-pointer text-xs">
                    <Eye className="mr-2 h-4 w-4 text-blue-500" />
                    View
                  </DropdownMenuItem>
                </Button>

                <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1">
                  <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => onEdit?.(user)}>
                    <Edit className="mr-2 h-4 w-4 text-green-500" />
                    Edit
                  </DropdownMenuItem>
                </Button>

                {!isCurrentUser && (
                  <Button variant="outline" className="border-0 w-full px-0 justify-start ps-1" onClick={() => setOpen(true)}>
                    <DropdownMenuItem className="cursor-pointer text-xs text-destructive" asChild>
                      <>
                        <Trash2 className="mx-2 h-4 w-4 text-red-500" />
                        Delete
                      </>
                    </DropdownMenuItem>
                  </Button>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              <Shield className="mr-1 h-3 w-3" />
              {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
            </Badge>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs bg-primary/10">
                <UserIcon className="mr-1 h-3 w-3" />
                You
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserView
        open={viewOpen}
        onOpenChange={setViewOpen}
        user={user}
      />
    </>
  );
}
