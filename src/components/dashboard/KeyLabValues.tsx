import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, UploadIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LabValue } from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

import { flagClass, flagTextClass } from "./utils"

interface KeyLabValuesProps {
  values: LabValue[]
  lastTestDate: string
  nextTestDue: string
}

function DeltaArrow({ current, previous }: { current: number; previous: number }) {
  if (current > previous)
    return <ArrowUpIcon className="size-3.5 text-destructive" aria-label="Increased" />
  if (current < previous)
    return <ArrowDownIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-label="Decreased" />
  return <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-label="Unchanged" />
}

export function KeyLabValues({
  values,
  lastTestDate,
  nextTestDue,
}: KeyLabValuesProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Key lab values</CardTitle>
        <CardDescription>
          Last test {lastTestDate}
          <span className="mx-1.5">·</span>
          Next due {nextTestDue}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {values.map((lab) => (
            <div
              key={lab.id}
              className="rounded-lg border p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{lab.name}</p>
                <span
                  className={cn("size-2 rounded-full", flagClass(lab.flag))}
                  title={lab.flag}
                  aria-label={`Flag: ${lab.flag}`}
                />
              </div>
              <p className="flex items-baseline gap-1.5">
                <span className={cn("text-xl font-medium tabular-nums", flagTextClass(lab.flag))}>
                  {lab.value}
                </span>
                <span className="text-xs text-muted-foreground">{lab.unit}</span>
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span>Was {lab.previousValue}</span>
                <DeltaArrow current={lab.value} previous={lab.previousValue} />
                <Badge variant="outline" className="ml-auto h-5 font-normal">
                  {lab.referenceLabel}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{lab.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t">
        <Button size="sm" variant="outline" aria-label="View all labs">
          View all labs
        </Button>
        <Button size="sm" aria-label="Upload lab report">
          <UploadIcon />
          Upload report
        </Button>
      </CardFooter>
    </Card>
  )
}
