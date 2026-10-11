import { RefreshCwIcon, WifiOffIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { SyncStatus } from "@/data/patient-dashboard-mock"

interface OfflineBannerProps {
  syncStatus: SyncStatus
  lastSyncAt: string
  onRetry?: () => void
}

export function OfflineBanner({
  syncStatus,
  lastSyncAt,
  onRetry,
}: OfflineBannerProps) {
  if (syncStatus === "ok") return null

  const title =
    syncStatus === "offline"
      ? "You appear to be offline"
      : "Sync failed — showing last saved data"

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
      <Alert variant="destructive" className="items-center">
        <WifiOffIcon />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>Last sync: {lastSyncAt}</AlertDescription>
        <div className="col-span-full mt-2 sm:col-start-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            aria-label="Retry sync"
          >
            <RefreshCwIcon />
            Retry
          </Button>
        </div>
      </Alert>
    </div>
  )
}
