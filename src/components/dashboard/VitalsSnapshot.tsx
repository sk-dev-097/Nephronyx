import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { VitalTile } from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

import { flagClass, flagTextClass } from "./utils"

interface MiniSparklineProps {
  data: VitalTile["sparkline"]
}

function MiniSparkline({ data }: MiniSparklineProps) {
  if (!data.length) return null
  return (
    <div className="h-8 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--foreground)"
            fill="var(--muted)"
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface VitalTileCardProps {
  tile: VitalTile
  devicePaired: boolean
  onSelect?: (metric: VitalTile["id"]) => void
}

function VitalTileCard({ tile, devicePaired, onSelect }: VitalTileCardProps) {
  const empty = tile.value == null

  return (
    <button
      type="button"
      onClick={() => onSelect?.(tile.id)}
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-4 text-left shadow-xs ring-1 ring-foreground/10 transition-colors",
        "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
      aria-label={`Open My Vitals for ${tile.label}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{tile.label}</span>
        {!empty && tile.flag ? (
          <span
            className={cn("size-2 rounded-full", flagClass(tile.flag))}
            aria-label={`Status ${tile.flag}`}
          />
        ) : null}
      </div>

      {empty ? (
        <div className="space-y-2 py-1">
          <p className="text-sm text-muted-foreground">
            {devicePaired ? "Sync device" : "Log now"}
          </p>
          <span className="text-xs text-primary underline-offset-4">
            {devicePaired ? "Pull latest reading" : "Enter manually"}
          </span>
        </div>
      ) : (
        <>
          <p className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-xl font-medium tabular-nums",
                flagTextClass(tile.flag)
              )}
            >
              {tile.value}
            </span>
            <span className="text-xs text-muted-foreground">{tile.unit}</span>
          </p>
          {tile.secondary ? (
            <p className="text-xs text-muted-foreground">{tile.secondary}</p>
          ) : null}
          {tile.hint ? (
            <p className="text-xs text-amber-800 dark:text-amber-400">{tile.hint}</p>
          ) : null}
          {typeof tile.progressPercent === "number" ? (
            <Progress value={tile.progressPercent} className="gap-1" />
          ) : null}
          <MiniSparkline data={tile.sparkline} />
          {tile.timestamp ? (
            <p className="text-xs text-muted-foreground">{tile.timestamp}</p>
          ) : null}
        </>
      )}
    </button>
  )
}

interface VitalsSnapshotProps {
  vitals: VitalTile[]
  devicePaired: boolean
}

export function VitalsSnapshot({ vitals, devicePaired }: VitalsSnapshotProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Today&apos;s vitals snapshot</CardTitle>
            <CardDescription>
              Tap a tile to open My Vitals for that metric
            </CardDescription>
          </div>
          <Button size="sm" aria-label="Log a reading">
            <PlusIcon />
            Log a reading
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {vitals.map((tile) => (
            <VitalTileCard
              key={tile.id}
              tile={tile}
              devicePaired={devicePaired}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
