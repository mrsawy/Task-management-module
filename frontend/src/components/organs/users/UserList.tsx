import { useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Card, CardContent } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';
import { Plus, Users, AlertCircle, Search } from 'lucide-react';
import type { User } from '@/lib/types/auth.interface';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import UserCard from './UserCard';
import UserForm from './UserForm';
import { Input } from '@/components/atoms/input';

export default function UserList({
  usersData,
  isLoading,
  error,
}: {
  usersData?: {
    data: User[];
    success: boolean;
  };
  isLoading: boolean;
  error: FetchBaseQueryError | SerializedError | undefined;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const users = Array.isArray(usersData?.data) ? usersData.data : [];

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) {
      return [];
    }

    if (!searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role?.name.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load users</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading users. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage users and their roles
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {users.length === 0 ? 'No users yet' : 'No users match your search'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {users.length === 0
                ? 'Create your first user to get started.'
                : 'Try adjusting your search criteria.'
              }
            </p>
            {users.length === 0 && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First User
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} onEdit={handleEditUser} />
          ))}
        </div>
      )}

      <UserForm
        open={showForm}
        onOpenChange={handleCloseForm}
        user={editingUser}
        onSuccess={() => {
          toast.success(`User ${editingUser ? 'updated' : 'created'} successfully`);
        }}
      />
    </div>
  );
}
