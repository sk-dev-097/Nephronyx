import { useCallback, useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AlertsActionsCard } from "@/components/dashboard/AlertsActionsCard"
import { CareTeamCard } from "@/components/dashboard/CareTeamCard"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar"
import { DisclaimerBanner } from "@/components/dashboard/DisclaimerBanner"
import { HealthTipCard } from "@/components/dashboard/HealthTipCard"
import { InfluencingFactors } from "@/components/dashboard/InfluencingFactors"
import { KeyLabValues } from "@/components/dashboard/KeyLabValues"
import { KidneyHealthStatusCard } from "@/components/dashboard/KidneyHealthStatusCard"
import { OfflineBanner } from "@/components/dashboard/OfflineBanner"
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist"
import { TodaysTasks } from "@/components/dashboard/TodaysTasks"
import { VitalsSnapshot } from "@/components/dashboard/VitalsSnapshot"
import { VitalsTrendChart } from "@/components/dashboard/VitalsTrendChart"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  patientDashboardMock,
  type PatientDashboardData,
} from "@/data/patient-dashboard-mock"

/**
 * Swap `patientDashboardMock` for `dashboardScenarios.firstTime | noDevice |
 * awaitingReview | offline | highRisk` to demo alternate states.
 */
function loadDashboard(): PatientDashboardData {
  return patientDashboardMock
}

function DashboardBody({
  data,
  onRetrySync,
}: {
  data: PatientDashboardData
  onRetrySync: () => void
}) {
  const { meta, patient } = data
  const showOnboarding = meta.isFirstTimeUser

  return (
    <>
      <DashboardTopBar
        patient={patient}
        dateLabel={meta.currentDateLabel}
        lastUpdatedLabel={meta.lastUpdatedLabel}
        notificationCount={meta.notificationCount}
      />
      <DisclaimerBanner />
      <OfflineBanner
        syncStatus={meta.syncStatus}
        lastSyncAt={meta.lastSyncAt}
        onRetry={onRetrySync}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        <h2 className="sr-only">Patient dashboard</h2>

        {showOnboarding ? (
          <div className="grid gap-4 md:gap-6">
            <OnboardingChecklist steps={data.onboardingSteps} />
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <CareTeamCard careTeam={data.careTeam} />
              <HealthTipCard tip={data.healthTip} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <KidneyHealthStatusCard status={data.kidneyHealth} />
            <AlertsActionsCard alerts={data.alerts} />

            <VitalsSnapshot
              vitals={data.vitals}
              devicePaired={meta.devicePaired}
            />

            <VitalsTrendChart
              chartSeries={data.chartSeries}
              chartRanges={data.chartRanges}
            />

            <div className="col-span-full">
              <KeyLabValues
                values={data.labs.values}
                lastTestDate={data.labs.lastTestDate}
                nextTestDue={data.labs.nextTestDue}
              />
            </div>

            <InfluencingFactors
              factors={data.influence.factors}
              footnote={data.influence.footnote}
            />
            <TodaysTasks tasks={data.tasks} />

            <CareTeamCard careTeam={data.careTeam} />
            <HealthTipCard tip={data.healthTip} />
          </div>
        )}
      </div>
    </>
  )
}

export default function PatientDashboard() {
  const [data, setData] = useState<PatientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setData(loadDashboard())
      setLoading(false)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [])

  const handleRetrySync = useCallback(() => {
    if (!data) return
    setData({
      ...data,
      meta: {
        ...data.meta,
        syncStatus: "ok",
        lastUpdatedLabel: "Updated just now",
        lastSyncAt: "Just now",
      },
    })
  }, [data])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {loading || !data ? (
          <>
            <div className="border-b px-4 py-4 md:px-6">
              <div className="flex items-center gap-2">
                <div className="size-7 animate-pulse rounded-md bg-muted" />
                <div className="space-y-2">
                  <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
                </div>
              </div>
            </div>
            <DisclaimerBanner />
            <DashboardSkeleton />
          </>
        ) : (
          <DashboardBody data={data} onRetrySync={handleRetrySync} />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
