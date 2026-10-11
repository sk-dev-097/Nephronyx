import { useMemo, useState } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardTask } from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

interface TodaysTasksProps {
  tasks: DashboardTask[]
}

function ProgressRing({
  value,
  total,
}: {
  value: number
  total: number
}) {
  const size = 56
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total === 0 ? 0 : value / total
  const offset = circumference * (1 - progress)

  return (
    <div
      className="relative size-14 shrink-0"
      role="img"
      aria-label={`${value} of ${total} tasks done`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-primary transition-[stroke-dashoffset]"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium tabular-nums">
        {value}/{total}
      </span>
    </div>
  )
}

export function TodaysTasks({ tasks: initialTasks }: TodaysTasksProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const doneCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  )

  function toggleTask(id: string, checked: boolean) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: checked } : t))
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Today&apos;s tasks</CardTitle>
            <CardDescription>
              {doneCount} of {tasks.length} done
            </CardDescription>
          </div>
          <ProgressRing value={doneCount} total={tasks.length} />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3" aria-label="Daily checklist">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3">
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={(checked) =>
                  toggleTask(task.id, checked === true)
                }
                aria-label={task.label}
                className="mt-0.5"
              />
              <label
                htmlFor={task.id}
                className={cn(
                  "cursor-pointer text-sm leading-snug",
                  task.completed && "text-muted-foreground line-through"
                )}
              >
                {task.label}
              </label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
