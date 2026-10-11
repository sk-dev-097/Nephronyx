import { AlertTriangleIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DisclaimerBanner() {
  return (
    <div className="border-b bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-2 md:px-6">
        <Alert className="border-transparent bg-transparent px-0 py-0 shadow-none">
          <AlertTriangleIcon className="text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm font-medium">
            Decision-support prototype, not a medical diagnosis.
          </AlertTitle>
          <AlertDescription className="sr-only">
            This dashboard provides decision support only and does not replace
            clinical judgment.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
