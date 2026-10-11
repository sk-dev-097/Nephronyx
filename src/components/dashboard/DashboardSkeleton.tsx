import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-2 md:gap-6 md:px-6" aria-busy="true" aria-label="Loading dashboard">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className={i >= 2 ? "col-span-full md:col-span-1" : undefined}>
          <CardHeader className="border-b">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="gap-3 pt-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
