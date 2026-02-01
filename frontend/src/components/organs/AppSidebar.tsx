"use client"

import * as React from "react"
import { NavDocuments } from "@/components/molecules/nav-documents"
import { NavMain } from "@/components/molecules/nav-main"
import { NavSecondary } from "@/components/molecules/nav-secondary"
import { NavUser } from "@/components/molecules/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
} from "@/components/atoms/sidebar"
import { ClipboardListIcon, InfoIcon, ListTodoIcon, SearchIcon, Settings2Icon, UsersIcon, LayoutGridIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useMeQuery } from "@/services/authApi"
import type { User } from "@/lib/types/auth.interface"

interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
    key: string;
    requiredPermission?: string; // Optional permission required to show this item
}

export const defaultData = {

    navMain: [
        {
            title: "My Tasks",
            url: "/dashboard/my-tasks",
            icon: ClipboardListIcon,
            key: "my-tasks",
        },
        {
            title: "Kanban Board",
            url: "/dashboard/tasks-kanban",
            icon: LayoutGridIcon,
            key: "tasks-kanban",
        },
        {
            title: "created tasks",
            url: "/dashboard/created-tasks",
            icon: ListTodoIcon,
            key: "created-tasks",
            requiredPermission: "tasks.create", // Only show if user has this permission
        },
        {
            title: "Users",
            url: "/dashboard/users",
            icon: UsersIcon,
            key: "users",
            requiredPermission: "users.view_all", // Only show if user has this permission
        },

    ],
    // documents: [
    // ],

    navSecondary: [
        {
            title: "Settings",
            url: "#",
            icon: Settings2Icon,
        },
        {
            title: "Get Help",
            url: "#",
            icon: InfoIcon,
        },
        {
            title: "Search",
            url: "/dashboard/my-tasks",
            icon: SearchIcon,
        },
    ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    data?: {
        navMain?: NavItem[];
        documents?: any[];
        navSecondary?: any[];
        user?: any;
    };
}

// Helper function to check if user has a specific permission
function hasPermission(user: User | undefined, permission: string): boolean {
    if (!user?.role?.permissions) return false;

    const [subject, action] = permission.split('.');
    return user.role.permissions.some(
        (p) => p.subject === subject && p.action === action
    );
}

export function AppSidebar({ data = defaultData, ...props }: AppSidebarProps) {

    const { data: user } = useMeQuery()

    // Filter navMain items based on permissions
    const filteredNavMain = data.navMain?.filter((item) => {
        if (item.requiredPermission && user) {
            return hasPermission(user, item.requiredPermission);
        }
        return true; // Show item if no permission required
    });

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <span className="text-base font-semibold">welcome back <span className="text-2xl"> 👋</span></span>

                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {filteredNavMain && <NavMain items={filteredNavMain} />}
                {data.documents && <NavDocuments items={data.documents} />}
                {data.navSecondary && <NavSecondary items={data.navSecondary} className="mt-auto" />}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user ? user : data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}
