import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { Badge } from '@/components/atoms/badge';
import { Mail, User as UserIcon, Shield, Calendar, UserPlus } from 'lucide-react';
import type { User } from '@/lib/types/auth.interface';
import { formatDate } from '@/lib/utils/dateUtils';

interface UserViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export default function UserView({ open, onOpenChange, user }: UserViewProps) {
  const roleName = user.role?.name || 'No Role';
  const permissions = user.role?.permissions || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View user information and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
              <p className="text-lg font-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {user.name}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
              <p className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Role</h3>
              <Badge variant="outline" className="text-sm">
                <Shield className="mr-1 h-3 w-3" />
                {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
              </Badge>
            </div>

            {user.creator && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
                <p className="text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {user.creator.name} ({user.creator.email})
                </p>
              </div>
            )}

            {user.created_at && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(user.created_at)}
                </p>
              </div>
            )}

            {permissions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.subject}.{permission.action}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
