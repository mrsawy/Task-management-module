
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/atoms/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/atoms/sidebar"
import { EllipsisVertical, LogOutIcon } from "lucide-react"
import { useLogoutMutation } from '@/services/authApi';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout as clientLogout } from '@/store/authSlice';
import { useDispatch } from 'react-redux';
import { getInitials } from "@/lib/utils";

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  const navigate = useNavigate()
  const dispatch = useDispatch();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:text-black"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="rounded-lg  dark:text-white ">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user?.email}
                </span>
              </div>

              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="rounded-lg">{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                try {
                  await logout();
                  dispatch(clientLogout());

                } catch (error) {
                  console.error("error logging out ==>", { error })
                } finally {
                  navigate("/auth/login")
                }
              }} disabled={isLoggingOut} >
              <LogOutIcon />
              Log out
              {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
