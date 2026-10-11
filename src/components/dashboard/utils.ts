import type { FlagLevel, TrendDirection, TrafficLightStatus } from "@/data/patient-dashboard-mock"

export function trafficLabel(status: TrafficLightStatus): string {
  switch (status) {
    case "stable":
      return "Stable"
    case "needs_attention":
      return "Needs attention"
    case "contact_doctor":
      return "Contact your doctor"
  }
}

export function trafficDotClass(status: TrafficLightStatus): string {
  switch (status) {
    case "stable":
      return "bg-emerald-500"
    case "needs_attention":
      return "bg-amber-500"
    case "contact_doctor":
      return "bg-destructive"
  }
}

export function trafficBadgeClass(status: TrafficLightStatus): string {
  switch (status) {
    case "stable":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "needs_attention":
      return "bg-amber-500/10 text-amber-800 dark:text-amber-400"
    case "contact_doctor":
      return "bg-destructive/10 text-destructive"
  }
}

export function flagClass(flag: FlagLevel | null | undefined): string {
  switch (flag) {
    case "normal":
      return "bg-emerald-500"
    case "elevated":
      return "bg-amber-500"
    case "low":
      return "bg-sky-500"
    case "critical":
      return "bg-destructive"
    default:
      return "bg-muted-foreground"
  }
}

export function flagTextClass(flag: FlagLevel | null | undefined): string {
  switch (flag) {
    case "normal":
      return "text-emerald-700 dark:text-emerald-400"
    case "elevated":
      return "text-amber-800 dark:text-amber-400"
    case "low":
      return "text-sky-700 dark:text-sky-400"
    case "critical":
      return "text-destructive"
    default:
      return "text-muted-foreground"
  }
}

export function trendLabel(trend: TrendDirection): string {
  switch (trend) {
    case "improving":
      return "Improving vs last check"
    case "stable":
      return "Stable vs last check"
    case "worsening":
      return "Worsening vs last check"
  }
}
