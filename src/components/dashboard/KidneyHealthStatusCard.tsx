import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  PhoneIcon,
  SirenIcon,
} from "lucide-react"

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
import type { KidneyHealthStatus } from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

import {
  trafficBadgeClass,
  trafficDotClass,
  trafficLabel,
  trendLabel,
} from "./utils"

interface KidneyHealthStatusCardProps {
  status: KidneyHealthStatus
}

function TrendIcon({ trend }: { trend: KidneyHealthStatus["trend"] }) {
  if (trend === "improving") return <ArrowDownIcon className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
  if (trend === "worsening") return <ArrowUpIcon className="size-4 text-destructive" aria-hidden />
  return <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden />
}

export function KidneyHealthStatusCard({ status }: KidneyHealthStatusCardProps) {
  const isHighRisk = status.isHighRisk || status.trafficLight === "contact_doctor"
  const awaiting =
    status.reviewStatus === "awaiting" || status.reviewStatus === "under_review"

  const reviewText =
    status.reviewStatus === "under_review"
      ? "Under review"
      : status.reviewStatus === "awaiting"
        ? "Awaiting review"
        : status.clinicianName
          ? `Reviewed by ${status.clinicianName}`
          : "Reviewed"

  return (
    <Card
      className={cn(
        "h-full",
        isHighRisk && "ring-destructive/40 bg-destructive/5"
      )}
    >
      <CardHeader className="border-b">
        <CardDescription>Kidney health status</CardDescription>
        <CardTitle className="text-lg">Your current risk overview</CardTitle>
      </CardHeader>
      <CardContent className="gap-4 pt-4">
        {isHighRisk ? (
          <div
            className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3"
            role="alert"
          >
            <p className="text-sm font-medium text-destructive">
              Please contact your care team soon. Stay calm — help is available.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="destructive" aria-label="Call emergency services">
                <SirenIcon />
                Emergency help
              </Button>
              <Button size="sm" variant="outline" aria-label="Contact your doctor">
                <PhoneIcon />
                Contact doctor
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn("size-3 rounded-full", trafficDotClass(status.trafficLight))}
            aria-hidden
          />
          <Badge
            variant="secondary"
            className={cn("border-0", trafficBadgeClass(status.trafficLight))}
          >
            {awaiting && status.reviewStatus === "under_review"
              ? "Under review"
              : trafficLabel(status.trafficLight)}
          </Badge>
        </div>

        {awaiting && status.reviewStatus === "under_review" ? (
          <div className="space-y-1">
            <p className="text-2xl font-heading font-medium tracking-tight">
              Under review
            </p>
            <p className="text-sm text-muted-foreground">
              Your clinician is reviewing the latest results. We&apos;ll update
              this card when they finish.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-2xl font-heading font-medium tracking-tight">
              {status.stageLabel}, eGFR {status.egfr}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrendIcon trend={status.trend} />
              <span>{trendLabel(status.trend)}</span>
            </div>
          </div>
        )}

        <dl className="grid gap-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Last assessed</dt>
            <dd>{status.lastAssessedAt}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Clinician review</dt>
            <dd>{reviewText}</dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          Discuss results with your doctor
        </p>
      </CardContent>
      <CardFooter className="border-t">
        <Button size="sm" aria-label="View details in My Kidney Risk">
          View details
        </Button>
      </CardFooter>
    </Card>
  )
}
