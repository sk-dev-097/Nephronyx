import {
  ActivityIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  SmartphoneIcon,
  UserRoundIcon,
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
import { Progress } from "@/components/ui/progress"
import type { OnboardingStep } from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

const icons = [
  UserRoundIcon,
  ClipboardListIcon,
  SmartphoneIcon,
  ActivityIcon,
] as const

interface OnboardingChecklistProps {
  steps: OnboardingStep[]
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const done = steps.filter((s) => s.completed).length
  const percent = Math.round((done / Math.max(steps.length, 1)) * 100)

  return (
    <Card className="col-span-full">
      <CardHeader className="border-b">
        <CardTitle>Get started with Nephronyx</CardTitle>
        <CardDescription>
          Complete these steps to unlock your personalized kidney dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4 pt-4">
        <Progress value={percent}>
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium">Setup progress</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {done} of {steps.length} done
            </span>
          </div>
        </Progress>

        <ul className="grid gap-3 md:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = icons[index % icons.length]!
            return (
              <li
                key={step.id}
                className={cn(
                  "flex gap-3 rounded-lg border p-4",
                  step.completed && "bg-muted/40"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted",
                    step.completed && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  )}
                  aria-hidden
                >
                  {step.completed ? <CheckCircle2Icon /> : <Icon />}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  {!step.completed ? (
                    <Button size="sm" className="mt-2">
                      Continue
                    </Button>
                  ) : (
                    <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                      Completed
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
      <CardFooter className="border-t">
        <p className="text-sm text-muted-foreground">
          You can finish setup anytime — your care team will see progress once
          consent and labs are in place.
        </p>
      </CardFooter>
    </Card>
  )
}
