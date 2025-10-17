"use client"


import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/atoms/sidebar"
import { ListChecks, type LucideProps } from "lucide-react"
import { Link } from "react-router-dom"
// import { ModeToggle } from "./theme-switcher"

import { useLocation } from 'react-router-dom';

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>,
    key: string
  }[]
}) {
  const location = useLocation();

  console.log({ location })
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <ListChecks />
              <span>Tasks Manegment</span>
            </SidebarMenuButton>
            {/* <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />

              <span className="sr-only">Inbox</span>
            </Button> */}
            {/* <ModeToggle /> */}

          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title} className={"rounded-md " + (location.pathname == item.url ? "bg-primary/10" : "")}>
              <Link to={item.url} key={item.key} >
                <SidebarMenuButton tooltip={item.title} className="cursor-pointer" >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
