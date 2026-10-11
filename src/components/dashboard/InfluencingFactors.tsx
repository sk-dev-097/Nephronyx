import {
  ActivityIcon,
  DropletsIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
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
import type { InfluenceFactor } from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

const iconMap = {
  bp: HeartPulseIcon,
  creatinine: FlaskConicalIcon,
  glucose: ActivityIcon,
  meds: PillIcon,
  hydration: DropletsIcon,
  activity: ActivityIcon,
} as const

interface InfluencingFactorsProps {
  factors: InfluenceFactor[]
  footnote?: string
}

export function InfluencingFactors({
  factors,
  footnote,
}: InfluencingFactorsProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>What influenced my result</CardTitle>
        <CardDescription>
          Plain-language factors behind today&apos;s kidney status
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4 pt-4">
        <ul className="space-y-4">
          {factors.slice(0, 4).map((factor) => {
            const Icon = iconMap[factor.icon]
            return (
              <li key={factor.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {factor.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({factor.weight})
                    </span>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="meter"
                  aria-valuenow={factor.impactPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${factor.label} influence`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all",
                      factor.weight === "major" && "bg-primary",
                      factor.weight === "moderate" && "bg-primary/70",
                      factor.weight === "minor" && "bg-primary/40"
                    )}
                    style={{ width: `${factor.impactPercent}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
        {footnote ? (
          <p className="text-sm text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="link" className="h-auto px-0" aria-label="See full explanation">
          See full explanation
        </Button>
      </CardFooter>
    </Card>
  )
}
