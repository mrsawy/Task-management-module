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
import { ClipboardListIcon, InfoIcon, ListTodoIcon, SearchIcon, Settings2Icon } from "lucide-react"
import { useMeQuery } from "@/services/authApi"

export const defaultData = {

    navMain: [
        {
            title: "My Tasks",
            url: "/dashboard/my-tasks",
            icon: ClipboardListIcon,
            key: "my-tasks",
        },
        {
            title: "created tasks",
            url: "/dashboard/created-tasks",
            icon: ListTodoIcon,
            key: "created-tasks",
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
        navMain?: any[];
        documents?: any[];
        navSecondary?: any[];
        user?: any;
    };
}

export function AppSidebar({ data = defaultData, ...props }: AppSidebarProps) {

    const { data: user } = useMeQuery()

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <span className="text-base font-semibold">welcome back <span className="text-2xl"> 👋</span></span>

                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {data.navMain && <NavMain items={data.navMain} />}
                {data.documents && <NavDocuments items={data.documents} />}
                {data.navSecondary && <NavSecondary items={data.navSecondary} className="mt-auto" />}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user ? user : data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}
