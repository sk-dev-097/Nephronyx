import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type {
  ChartMetric,
  ChartPoint,
  ChartRange,
  PatientDashboardData,
} from "@/data/patient-dashboard-mock"
import { cn } from "@/lib/utils"

const metrics: { id: ChartMetric; label: string }[] = [
  { id: "bp", label: "BP" },
  { id: "hr", label: "HR" },
  { id: "spo2", label: "SpO₂" },
]

const ranges: { id: ChartRange; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
]

const chartConfig = {
  value: { label: "Reading", color: "var(--chart-2)" },
  band: { label: "Target range", color: "var(--muted)" },
} satisfies ChartConfig

interface VitalsTrendChartProps {
  chartSeries: PatientDashboardData["chartSeries"]
  chartRanges: PatientDashboardData["chartRanges"]
}

export function VitalsTrendChart({
  chartSeries,
  chartRanges,
}: VitalsTrendChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("bp")
  const [range, setRange] = useState<ChartRange>("7d")

  const data = chartSeries[metric][range]
  const band = chartRanges[metric]

  const labMarkers = useMemo(
    () => data.filter((d) => d.labMarker),
    [data]
  )

  return (
    <Card className="col-span-full">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Vitals trend</CardTitle>
            <CardDescription>
              Shaded band shows {band.label.toLowerCase()}. Highlighted points are
              outside range.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div
              className="inline-flex rounded-md border p-0.5"
              role="group"
              aria-label="Select metric"
            >
              {metrics.map((m) => (
                <Button
                  key={m.id}
                  size="sm"
                  variant={metric === m.id ? "secondary" : "ghost"}
                  className={cn("h-7", metric === m.id && "shadow-xs")}
                  onClick={() => setMetric(m.id)}
                  aria-pressed={metric === m.id}
                >
                  {m.label}
                </Button>
              ))}
            </div>
            <div
              className="inline-flex rounded-md border p-0.5"
              role="group"
              aria-label="Select time range"
            >
              {ranges.map((r) => (
                <Button
                  key={r.id}
                  size="sm"
                  variant={range === r.id ? "secondary" : "ghost"}
                  className={cn("h-7", range === r.id && "shadow-xs")}
                  onClick={() => setRange(r.id)}
                  aria-pressed={range === r.id}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="aspect-[21/9] w-full min-h-56">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={36}
              domain={["auto", "auto"]}
            />
            <ReferenceArea
              y1={band.low}
              y2={band.high}
              fill="var(--muted)"
              fillOpacity={0.55}
              strokeOpacity={0}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload, index } = props as {
                  cx?: number
                  cy?: number
                  index?: number
                  payload?: ChartPoint
                }
                if (cx == null || cy == null) return <g key={index} />
                const abnormal = payload?.abnormal
                return (
                  <circle
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={abnormal ? 5 : 3}
                    className={
                      abnormal
                        ? "fill-destructive stroke-background"
                        : "fill-[var(--color-value)] stroke-background"
                    }
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{ r: 5 }}
            />
            {labMarkers.map((marker) => (
              <ReferenceDot
                key={`lab-${marker.date}-${marker.value}`}
                x={marker.date}
                y={marker.value}
                r={6}
                className="fill-amber-500 stroke-background"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            ))}
          </LineChart>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
            Target / normal range
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" aria-hidden />
            Outside range
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" aria-hidden />
            Lab result added
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
