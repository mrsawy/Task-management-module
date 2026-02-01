import UserList from "@/components/organs/users/UserList"
import { useGetUsersQuery } from '@/services/userApi';

export default function Users() {
  const { data: usersData, isLoading, error } = useGetUsersQuery()
  return <UserList usersData={usersData} isLoading={isLoading} error={error} />
}
