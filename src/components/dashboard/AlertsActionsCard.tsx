import {
  AlertCircleIcon,
  ClipboardListIcon,
  HeartPulseIcon,
  MessageSquareIcon,
  PillIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { DashboardAlert } from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

const iconMap = {
  bp: HeartPulseIcon,
  lab: ClipboardListIcon,
  missing: AlertCircleIcon,
  meds: PillIcon,
  general: MessageSquareIcon,
} as const

interface AlertsActionsCardProps {
  alerts: DashboardAlert[]
}

export function AlertsActionsCard({ alerts }: AlertsActionsCardProps) {
  const top = alerts
    .slice()
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 }
      return rank[a.urgency] - rank[b.urgency]
    })
    .slice(0, 3)

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <CardTitle>Alerts & actions needed</CardTitle>
        <CardDescription>Most urgent items right now</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {top.length === 0 ? (
          <Empty className="border-0 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HeartPulseIcon />
              </EmptyMedia>
              <EmptyTitle>All clear</EmptyTitle>
              <EmptyDescription>
                All clear, no alerts right now
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {top.map((alert) => {
              const Icon = iconMap[alert.icon]
              return (
                <li
                  key={alert.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted",
                        alert.urgency === "high" &&
                          "bg-destructive/10 text-destructive",
                        alert.urgency === "medium" &&
                          "bg-amber-500/10 text-amber-800 dark:text-amber-400"
                      )}
                      aria-hidden
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.timeLabel}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 self-start sm:self-auto">
                    {alert.actionLabel}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="link" className="h-auto px-0" aria-label="View all alerts">
          View all
        </Button>
      </CardFooter>
    </Card>
  )
}
