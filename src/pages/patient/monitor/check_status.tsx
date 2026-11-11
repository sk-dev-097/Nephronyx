import { useCallback, useEffect, useId, useRef, useState } from "react"
import {
  ActivityIcon,
  Loader2Icon,
  SaveIcon,
  SparklesIcon,
  WatchIcon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

/**
 * Backend base URL. On Render, set VITE_API_URL to the nephronyx-api URL
 * (no trailing slash). Locally it is empty, so the Vite dev proxy handles /api.
 */
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/+$/, "")

export type PatientClinicalData = {
  age: number
  sex: number
  bp_systolic_mmHg: number
  bp_diastolic_mmHg: number
  body_weight_kg: number
  heart_rate_bpm: number
  blood_glucose_mg_dL: number
  bun_mg_dL: number
  uacr_mg_g: number
  serum_potassium_mmol_L: number
  serum_creatinine_mg_dL: number
  "egfr_mL_min_1.73m2": number
}

/** Sample vitals pulled when NephroWatch connects. */
const NEPHROWATCH_VITALS: Partial<PatientClinicalData> = {
  bp_systolic_mmHg: 138,
  bp_diastolic_mmHg: 86,
  heart_rate_bpm: 74,
  body_weight_kg: 72.5,
}

type FieldKey = keyof PatientClinicalData

type FieldDef = {
  key: FieldKey
  label: string
  unit?: string
  step?: string
  min?: number
  max?: number
  group: "vitals" | "labs"
}

const FIELDS: FieldDef[] = [
  { key: "age", label: "Age", unit: "years", group: "vitals", min: 1, max: 120 },
  { key: "sex", label: "Sex (0 = Male, 1 = Female)", group: "vitals", min: 0, max: 1, step: "1" },
  { key: "bp_systolic_mmHg", label: "Systolic BP", unit: "mmHg", group: "vitals" },
  { key: "bp_diastolic_mmHg", label: "Diastolic BP", unit: "mmHg", group: "vitals" },
  { key: "heart_rate_bpm", label: "Heart rate", unit: "bpm", group: "vitals" },
  { key: "body_weight_kg", label: "Body weight", unit: "kg", group: "vitals", step: "0.1" },
  { key: "blood_glucose_mg_dL", label: "Blood glucose", unit: "mg/dL", group: "labs" },
  { key: "bun_mg_dL", label: "BUN", unit: "mg/dL", group: "labs", step: "0.1" },
  { key: "uacr_mg_g", label: "UACR", unit: "mg/g", group: "labs", step: "0.1" },
  { key: "serum_potassium_mmol_L", label: "Serum potassium", unit: "mmol/L", group: "labs", step: "0.1" },
  { key: "serum_creatinine_mg_dL", label: "Serum creatinine", unit: "mg/dL", group: "labs", step: "0.01" },
  { key: "egfr_mL_min_1.73m2", label: "eGFR", unit: "mL/min/1.73m²", group: "labs", step: "0.1" },
]

const EMPTY_FORM: Record<FieldKey, string> = {
  age: "",
  sex: "",
  bp_systolic_mmHg: "",
  bp_diastolic_mmHg: "",
  body_weight_kg: "",
  heart_rate_bpm: "",
  blood_glucose_mg_dL: "",
  bun_mg_dL: "",
  uacr_mg_g: "",
  serum_potassium_mmol_L: "",
  serum_creatinine_mg_dL: "",
  "egfr_mL_min_1.73m2": "",
}

const PREDICTION_STORAGE_KEY = "nephronyx.check_status.prediction"

type StageProbability = {
  stage: number
  probability: number
  percent: number
}

type PredictionResult = {
  stage: number
  probabilities: StageProbability[]
  features_used?: string[]
}

function dataToForm(data: Partial<PatientClinicalData>): Record<FieldKey, string> {
  const next = { ...EMPTY_FORM }
  for (const field of FIELDS) {
    const value = data[field.key]
    if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
      next[field.key] = String(value)
    }
  }
  return next
}

/** Only keys present in `data` — never blanks out other form fields. */
function partialDataToFormPatch(
  data: Partial<PatientClinicalData>
): Partial<Record<FieldKey, string>> {
  const patch: Partial<Record<FieldKey, string>> = {}
  for (const field of FIELDS) {
    const value = data[field.key]
    if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
      patch[field.key] = String(value)
    }
  }
  return patch
}

function formToData(form: Record<FieldKey, string>): PatientClinicalData {
  const out = {} as PatientClinicalData
  for (const field of FIELDS) {
    const raw = form[field.key].trim()
    if (raw === "" || Number.isNaN(Number(raw))) {
      throw new Error(`Please enter a valid number for ${field.label}.`)
    }
    out[field.key] = Number(raw)
  }
  return out
}

function stageTone(stage: number) {
  if (stage <= 2) return "text-emerald-700 dark:text-emerald-400"
  if (stage === 3) return "text-amber-700 dark:text-amber-400"
  return "text-destructive"
}

function normalizePrediction(body: unknown): PredictionResult {
  if (!body || typeof body !== "object") {
    throw new Error("Prediction response was empty.")
  }
  const raw = body as Record<string, unknown>
  if (typeof raw.error === "string" && raw.error) {
    throw new Error(raw.error)
  }
  const stage = Number(raw.stage)
  if (!Number.isFinite(stage)) {
    throw new Error("Prediction response did not include a stage.")
  }

  const list = Array.isArray(raw.probabilities) ? raw.probabilities : []
  const probabilities: StageProbability[] = list.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>
    const probability = Number(row.probability ?? 0)
    const percent = Number(
      row.percent ?? (Number.isFinite(probability) ? probability * 100 : 0)
    )
    return {
      stage: Number(row.stage ?? index + 1),
      probability: Number.isFinite(probability) ? probability : 0,
      percent: Number.isFinite(percent) ? percent : 0,
    }
  })

  if (probabilities.length === 0) {
    for (let i = 1; i <= 5; i += 1) {
      probabilities.push({
        stage: i,
        probability: i === stage ? 1 : 0,
        percent: i === stage ? 100 : 0,
      })
    }
  }

  return {
    stage,
    probabilities,
    features_used: Array.isArray(raw.features_used)
      ? (raw.features_used as string[])
      : undefined,
  }
}

function readStoredPrediction(): PredictionResult | null {
  try {
    const raw = sessionStorage.getItem(PREDICTION_STORAGE_KEY)
    if (!raw) return null
    return normalizePrediction(JSON.parse(raw))
  } catch {
    return null
  }
}

function storePrediction(result: PredictionResult | null) {
  try {
    if (!result) {
      sessionStorage.removeItem(PREDICTION_STORAGE_KEY)
      return
    }
    sessionStorage.setItem(PREDICTION_STORAGE_KEY, JSON.stringify(result))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

function ProbabilityBar({ percent, isPredicted }: { percent: number; isPredicted: boolean }) {
  const width = Math.max(0, Math.min(100, percent))
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          isPredicted ? "bg-primary" : "bg-foreground/40"
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export default function CheckStatusPage() {
  const resultRef = useRef<HTMLDivElement>(null)
  const formId = useId()
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PredictionResult | null>(() =>
    readStoredPrediction()
  )

  const loadSaved = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/patient-data`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          (body as { error?: string }).error || "Could not load saved patient data."
        )
      }
      const data = (await res.json()) as PatientClinicalData
      setForm(dataToForm(data))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load patient data. Is the API server running?"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSaved()
  }, [loadSaved])

  useEffect(() => {
    if (!prediction) return
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [prediction])

  const updateField = (key: FieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleConnectNephroWatch = async () => {
    setConnecting(true)
    setError(null)
    setMessage(null)
    try {
      // Simulate pairing / sync latency with NephroWatch.
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      // Update vitals only — leave existing lab values on the page unchanged.
      setForm((prev) => ({
        ...prev,
        ...partialDataToFormPatch(NEPHROWATCH_VITALS),
      }))
      setPrediction(null)
      storePrediction(null)
      setMessage(
        "Connected to NephroWatch. Vitals were updated; lab values were left unchanged."
      )
      setConnectOpen(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect to NephroWatch."
      )
    } finally {
      setConnecting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const payload = formToData(form)
      const res = await fetch(`${API_BASE}/api/patient-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || "Save failed.")
      }
      setMessage("Clinical data saved to patient_data.json.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.")
    } finally {
      setSaving(false)
    }
  }

  const handlePredict = async () => {
    setPredicting(true)
    setError(null)
    setMessage(null)
    try {
      const payload = formToData(form)
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || "Prediction failed.")
      }
      const result = normalizePrediction(body)
      setPrediction(result)
      storePrediction(result)
      setMessage(`Prediction complete: CKD Stage ${result.stage}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed.")
    } finally {
      setPredicting(false)
    }
  }

  const vitals = FIELDS.filter((f) => f.group === "vitals")
  const labs = FIELDS.filter((f) => f.group === "labs")

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AlertDialog
          open={connectOpen}
          onOpenChange={(open) => {
            if (connecting && !open) return
            setConnectOpen(open)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <WatchIcon />
              </AlertDialogMedia>
              <AlertDialogTitle>Connect to NephroWatch?</AlertDialogTitle>
              <AlertDialogDescription>
                Import the latest vitals from your NephroWatch device. Blood
                pressure, heart rate, and weight will fill into this form.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={connecting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                disabled={connecting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleConnectNephroWatch()
                }}
              >
                {connecting ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <WatchIcon />
                )}
                Connect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="flex items-center gap-2 px-4 py-4 md:px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-1 hidden h-8 sm:block" />
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-xl font-heading font-medium tracking-tight md:text-2xl">
                Check status
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter clinical data, save it, and run the CKD stage prediction.
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6 md:px-6">
          {(message || error) && (
            <div
              role={error ? "alert" : "status"}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                error
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              )}
            >
              {error || message}
            </div>
          )}

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardDescription>Clinical intake</CardDescription>
                  <CardTitle className="text-lg">Patient clinical data</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConnectOpen(true)}
                    disabled={loading || connecting}
                  >
                    <WatchIcon />
                    Import vital data
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleSave()}
                    disabled={loading || saving || predicting || connecting}
                  >
                    {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
                    Save data
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="gap-8 pt-6">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  Loading saved patient data…
                </div>
              ) : (
                <>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="size-4 text-muted-foreground" />
                      <h2 className="text-sm font-medium">Vitals</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {vitals.map((field) => {
                        const inputId = `${formId}-${field.key}`
                        return (
                          <div key={field.key} className="grid gap-2">
                            <Label htmlFor={inputId}>
                              {field.label}
                              {field.unit ? (
                                <span className="font-normal text-muted-foreground">
                                  {" "}
                                  ({field.unit})
                                </span>
                              ) : null}
                            </Label>
                            <Input
                              id={inputId}
                              type="number"
                              inputMode="decimal"
                              step={field.step ?? "any"}
                              min={field.min}
                              max={field.max}
                              value={form[field.key]}
                              onChange={(e) => updateField(field.key, e.target.value)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-4">
                    <h2 className="text-sm font-medium">Lab values</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {labs.map((field) => {
                        const inputId = `${formId}-${field.key}`
                        return (
                          <div key={field.key} className="grid gap-2">
                            <Label htmlFor={inputId}>
                              {field.label}
                              {field.unit ? (
                                <span className="font-normal text-muted-foreground">
                                  {" "}
                                  ({field.unit})
                                </span>
                              ) : null}
                            </Label>
                            <Input
                              id={inputId}
                              type="number"
                              inputMode="decimal"
                              step={field.step ?? "any"}
                              min={field.min}
                              max={field.max}
                              value={form[field.key]}
                              onChange={(e) => updateField(field.key, e.target.value)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </>
              )}
            </CardContent>

            <CardFooter className="border-t justify-end gap-2">
              <Button
                type="button"
                onClick={() => void handlePredict()}
                disabled={loading || saving || predicting}
              >
                {predicting ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <SparklesIcon />
                )}
                Run prediction
              </Button>
            </CardFooter>
          </Card>

          {prediction ? (
            <div ref={resultRef}>
              <Card>
                <CardHeader className="border-b">
                  <CardDescription>Model output</CardDescription>
                  <CardTitle className="text-lg">CKD stage prediction</CardTitle>
                </CardHeader>
                <CardContent className="gap-6 pt-6">
                  <div className="rounded-lg border bg-muted/30 px-4 py-5">
                    <p className="text-sm text-muted-foreground">Predicted CKD stage</p>
                    <p
                      className={cn(
                        "mt-1 text-4xl font-heading font-semibold tracking-tight",
                        stageTone(prediction.stage)
                      )}
                    >
                      Stage {prediction.stage}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Class probabilities</h3>
                    <ul className="space-y-3">
                      {prediction.probabilities.map((item) => {
                        const isPredicted = item.stage === prediction.stage
                        return (
                          <li key={item.stage} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className={cn(isPredicted && "font-medium")}>
                                Stage {item.stage}
                                {isPredicted ? " · predicted" : ""}
                              </span>
                              <span className="tabular-nums text-muted-foreground">
                                {item.percent.toFixed(2)}%
                              </span>
                            </div>
                            <ProbabilityBar
                              percent={item.percent}
                              isPredicted={isPredicted}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}