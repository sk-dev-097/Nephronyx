"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  ActivityIcon,
  CalendarIcon,
  ClipboardListIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  StethoscopeIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Aanya Sharma",
    email: "aanya.sharma@email.com",
    avatar: "",
  },
  teams: [
    {
      name: "Nephronyx",
      logo: <StethoscopeIcon />,
      plan: "Patient",
    },
    {
      name: "Care circle",
      logo: <HeartPulseIcon />,
      plan: "Family",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [
        { title: "Overview", url: "#/" },
        { title: "Today's tasks", url: "#/" },
        { title: "Health tip", url: "#/" },
      ],
    },
    {
      title: "My Kidney Risk",
      url: "#",
      icon: <ActivityIcon />,
      items: [
        { title: "Status details", url: "#" },
        { title: "What influenced my result", url: "#" },
        { title: "History", url: "#" },
      ],
    },
    {
      title: "Monitor",
      url: "#/monitor/check-status",
      icon: <ActivityIcon />,
      items: [
        { title: "Check Status", url: "#/monitor/check-status" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        { title: "Profile", url: "#" },
        { title: "Devices", url: "#" },
        { title: "Notifications", url: "#" },
        { title: "Consent & privacy", url: "#" },
      ],
    },
  ],
  projects: [
    {
      name: "Appointments",
      url: "#",
      icon: <CalendarIcon />,
    },
    {
      name: "Tasks",
      url: "#",
      icon: <ClipboardListIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} label="Care" />
        <NavProjects projects={data.projects} label="Shortcuts" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
