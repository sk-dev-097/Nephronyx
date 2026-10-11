import { BellIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { PatientProfile } from "@/data/patient-dashboard-mock"

interface DashboardTopBarProps {
  patient: PatientProfile
  dateLabel: string
  lastUpdatedLabel: string
  notificationCount: number
}

export function DashboardTopBar({
  patient,
  dateLabel,
  lastUpdatedLabel,
  notificationCount,
}: DashboardTopBarProps) {
  const initials = `${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex min-w-0 items-start gap-2">
          <SidebarTrigger className="mt-0.5" />
          <Separator orientation="vertical" className="mr-1 hidden h-8 sm:block" />
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-xl font-heading font-medium tracking-tight md:text-2xl">
              Welcome back, {patient.firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {dateLabel}
              <span className="mx-2 text-border" aria-hidden>
                ·
              </span>
              {lastUpdatedLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="icon"
            className="relative"
            aria-label={`Notifications, ${notificationCount} unread`}
          >
            <BellIcon />
            {notificationCount > 0 ? (
              <Badge
                variant="destructive"
                className="absolute -top-1.5 -right-1.5 h-5 min-w-5 justify-center rounded-full px-1"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="gap-2 pl-1.5"
                  aria-label="Open profile menu"
                />
              }
            >
              <Avatar size="sm">
                {patient.avatarUrl ? (
                  <AvatarImage src={patient.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate sm:inline">
                {patient.firstName} {patient.lastName}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem>
                <UserIcon />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOutIcon />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
