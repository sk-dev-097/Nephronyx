/** Types and mocked data for the CKD patient dashboard. No API calls. */

export type TrafficLightStatus = "stable" | "needs_attention" | "contact_doctor"
export type TrendDirection = "improving" | "stable" | "worsening"
export type ReviewStatus = "reviewed" | "awaiting" | "under_review"
export type FlagLevel = "normal" | "elevated" | "low" | "critical"
export type SyncStatus = "ok" | "offline" | "failed"
export type AlertAction = "log_reading" | "book_test" | "message_doctor"
export type VitalMetric = "bp" | "hr" | "spo2" | "activity" | "weight"
export type ChartMetric = "bp" | "hr" | "spo2"
export type ChartRange = "7d" | "30d" | "90d"
export type InfluenceWeight = "major" | "moderate" | "minor"
export type AppointmentMode = "in_person" | "video"

export interface PatientProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
}

export interface KidneyHealthStatus {
  trafficLight: TrafficLightStatus
  stageLabel: string
  egfr: number
  trend: TrendDirection
  lastAssessedAt: string
  reviewStatus: ReviewStatus
  clinicianName?: string
  isHighRisk: boolean
}

export interface DashboardAlert {
  id: string
  message: string
  timeLabel: string
  urgency: "low" | "medium" | "high"
  action: AlertAction
  actionLabel: string
  icon: "bp" | "lab" | "missing" | "meds" | "general"
}

export interface SparkPoint {
  day: string
  value: number
}

export interface VitalTile {
  id: VitalMetric
  label: string
  value: string | null
  unit: string
  flag: FlagLevel | null
  timestamp: string | null
  sparkline: SparkPoint[]
  hint?: string
  /** Secondary line e.g. resting HR */
  secondary?: string
  /** 0–100 for activity progress */
  progressPercent?: number
}

export interface ChartPoint {
  date: string
  value: number
  systolic?: number
  diastolic?: number
  abnormal?: boolean
  labMarker?: boolean
}

export interface LabValue {
  id: string
  name: string
  value: number
  unit: string
  previousValue: number
  flag: FlagLevel
  note: string
  referenceLabel: string
}

export interface InfluenceFactor {
  id: string
  label: string
  weight: InfluenceWeight
  /** 0–100 visual bar only — not raw SHAP */
  impactPercent: number
  icon: "bp" | "creatinine" | "glucose" | "meds" | "hydration" | "activity"
}

export interface DashboardTask {
  id: string
  label: string
  completed: boolean
  category: "medication" | "vitals" | "hydration" | "lab" | "other"
}

export interface CareTeam {
  clinicianName: string
  specialty: string
  photoUrl?: string
  initials: string
  nextAppointment: {
    dateLabel: string
    timeLabel: string
    mode: AppointmentMode
  }
  lastNotePreview: string
}

export interface HealthTip {
  id: string
  title: string
  body: string
  topic: string
}

export interface OnboardingStep {
  id: string
  label: string
  description: string
  completed: boolean
}

export interface DashboardMeta {
  currentDateLabel: string
  lastUpdatedLabel: string
  notificationCount: number
  isFirstTimeUser: boolean
  devicePaired: boolean
  syncStatus: SyncStatus
  lastSyncAt: string
  isLoading: boolean
}

export interface PatientDashboardData {
  meta: DashboardMeta
  patient: PatientProfile
  kidneyHealth: KidneyHealthStatus
  alerts: DashboardAlert[]
  vitals: VitalTile[]
  chartSeries: Record<ChartMetric, Record<ChartRange, ChartPoint[]>>
  chartRanges: Record<
    ChartMetric,
    { low: number; high: number; label: string }
  >
  labs: {
    values: LabValue[]
    lastTestDate: string
    nextTestDue: string
  }
  influence: {
    factors: InfluenceFactor[]
    footnote?: string
  }
  tasks: DashboardTask[]
  careTeam: CareTeam
  healthTip: HealthTip
  onboardingSteps: OnboardingStep[]
}

const bp7d: ChartPoint[] = [
  { date: "Mon", value: 128, systolic: 128, diastolic: 82 },
  { date: "Tue", value: 132, systolic: 132, diastolic: 84 },
  { date: "Wed", value: 145, systolic: 145, diastolic: 90, abnormal: true },
  { date: "Thu", value: 138, systolic: 138, diastolic: 86 },
  { date: "Fri", value: 136, systolic: 136, diastolic: 85 },
  { date: "Sat", value: 140, systolic: 140, diastolic: 88, labMarker: true },
  { date: "Sun", value: 138, systolic: 138, diastolic: 86 },
]

const bp30d: ChartPoint[] = Array.from({ length: 30 }, (_, i) => {
  const systolic = 124 + Math.round(Math.sin(i / 3) * 10) + (i % 7 === 3 ? 16 : 0)
  return {
    date: `D${i + 1}`,
    value: systolic,
    systolic,
    diastolic: 78 + (i % 5),
    abnormal: systolic >= 140,
    labMarker: i === 22,
  }
})

const bp90d: ChartPoint[] = Array.from({ length: 90 }, (_, i) => {
  const systolic = 122 + Math.round(Math.sin(i / 8) * 12) + (i % 11 === 0 ? 18 : 0)
  return {
    date: `D${i + 1}`,
    value: systolic,
    systolic,
    diastolic: 76 + (i % 6),
    abnormal: systolic >= 140,
    labMarker: i === 60,
  }
})

const hrSeries = (n: number): ChartPoint[] =>
  Array.from({ length: n }, (_, i) => {
    const value = 68 + Math.round(Math.sin(i / 2) * 8) + (i % 9 === 4 ? 22 : 0)
    return {
      date: n <= 7 ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]! : `D${i + 1}`,
      value,
      abnormal: value > 100,
      labMarker: i === Math.floor(n * 0.7),
    }
  })

const spo2Series = (n: number): ChartPoint[] =>
  Array.from({ length: n }, (_, i) => {
    const value = 97 - (i % 5 === 2 ? 3 : 0) - (i % 13 === 0 ? 4 : 0)
    return {
      date: n <= 7 ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]! : `D${i + 1}`,
      value,
      abnormal: value < 94,
      labMarker: i === Math.floor(n * 0.55),
    }
  })

export const patientDashboardMock: PatientDashboardData = {
  meta: {
    currentDateLabel: "Monday, 21 Sep 2026",
    lastUpdatedLabel: "Updated 12 min ago",
    notificationCount: 3,
    isFirstTimeUser: false,
    devicePaired: true,
    syncStatus: "ok",
    lastSyncAt: "Today, 1:05 PM",
    isLoading: false,
  },
  patient: {
    id: "pt-1001",
    firstName: "Aanya",
    lastName: "Sharma",
    email: "aanya.sharma@email.com",
    avatarUrl: undefined,
  },
  kidneyHealth: {
    trafficLight: "needs_attention",
    stageLabel: "Stage 3a",
    egfr: 52,
    trend: "stable",
    lastAssessedAt: "21 Sep 2026, 9:14 AM",
    reviewStatus: "reviewed",
    clinicianName: "Dr. Mehta",
    isHighRisk: false,
  },
  alerts: [
    {
      id: "a1",
      message: "BP higher than usual for 3 days",
      timeLabel: "2h ago",
      urgency: "high",
      action: "log_reading",
      actionLabel: "Log reading",
      icon: "bp",
    },
    {
      id: "a2",
      message: "Creatinine test due",
      timeLabel: "Yesterday",
      urgency: "medium",
      action: "book_test",
      actionLabel: "Book test",
      icon: "lab",
    },
    {
      id: "a3",
      message: "No reading logged today",
      timeLabel: "This morning",
      urgency: "low",
      action: "log_reading",
      actionLabel: "Log reading",
      icon: "missing",
    },
    {
      id: "a4",
      message: "Evening medication reminder",
      timeLabel: "6h ago",
      urgency: "low",
      action: "message_doctor",
      actionLabel: "Message doctor",
      icon: "meds",
    },
  ],
  vitals: [
    {
      id: "bp",
      label: "Blood pressure",
      value: "138/86",
      unit: "mmHg",
      flag: "elevated",
      timestamp: "Today, 8:42 AM",
      secondary: "Above your usual range",
      sparkline: [
        { day: "M", value: 128 },
        { day: "T", value: 132 },
        { day: "W", value: 145 },
        { day: "T", value: 138 },
        { day: "F", value: 136 },
        { day: "S", value: 140 },
        { day: "S", value: 138 },
      ],
    },
    {
      id: "hr",
      label: "Heart rate",
      value: "74",
      unit: "bpm",
      flag: "normal",
      timestamp: "Today, 8:42 AM",
      secondary: "Resting 68 bpm",
      sparkline: [
        { day: "M", value: 70 },
        { day: "T", value: 72 },
        { day: "W", value: 78 },
        { day: "T", value: 71 },
        { day: "F", value: 69 },
        { day: "S", value: 73 },
        { day: "S", value: 74 },
      ],
    },
    {
      id: "spo2",
      label: "SpO₂",
      value: "97",
      unit: "%",
      flag: "normal",
      timestamp: "Today, 8:42 AM",
      sparkline: [
        { day: "M", value: 98 },
        { day: "T", value: 97 },
        { day: "W", value: 96 },
        { day: "T", value: 98 },
        { day: "F", value: 97 },
        { day: "S", value: 98 },
        { day: "S", value: 97 },
      ],
    },
    {
      id: "activity",
      label: "Activity",
      value: "4,280",
      unit: "steps",
      flag: "normal",
      timestamp: "Today, 1:00 PM",
      progressPercent: 57,
      secondary: "Goal 7,500 steps",
      sparkline: [
        { day: "M", value: 6200 },
        { day: "T", value: 5100 },
        { day: "W", value: 4800 },
        { day: "T", value: 7100 },
        { day: "F", value: 3900 },
        { day: "S", value: 8200 },
        { day: "S", value: 4280 },
      ],
    },
    {
      id: "weight",
      label: "Weight",
      value: "68.4",
      unit: "kg",
      flag: "elevated",
      timestamp: "Yesterday, 7:10 AM",
      hint: "Up 1.2 kg in 2 days — possible fluid retention",
      sparkline: [
        { day: "M", value: 67.1 },
        { day: "T", value: 67.2 },
        { day: "W", value: 67.3 },
        { day: "T", value: 67.4 },
        { day: "F", value: 67.8 },
        { day: "S", value: 68.2 },
        { day: "S", value: 68.4 },
      ],
    },
  ],
  chartSeries: {
    bp: { "7d": bp7d, "30d": bp30d, "90d": bp90d },
    hr: {
      "7d": hrSeries(7),
      "30d": hrSeries(30),
      "90d": hrSeries(90),
    },
    spo2: {
      "7d": spo2Series(7),
      "30d": spo2Series(30),
      "90d": spo2Series(90),
    },
  },
  chartRanges: {
    bp: { low: 90, high: 130, label: "Target systolic" },
    hr: { low: 60, high: 100, label: "Normal resting HR" },
    spo2: { low: 95, high: 100, label: "Normal SpO₂" },
  },
  labs: {
    lastTestDate: "14 Sep 2026",
    nextTestDue: "12 Oct 2026",
    values: [
      {
        id: "egfr",
        name: "eGFR",
        value: 52,
        unit: "mL/min/1.73m²",
        previousValue: 54,
        flag: "elevated",
        note: "Slightly lower than last test",
        referenceLabel: "≥60 preferred",
      },
      {
        id: "creatinine",
        name: "Creatinine",
        value: 1.4,
        unit: "mg/dL",
        previousValue: 1.3,
        flag: "elevated",
        note: "Higher than your usual",
        referenceLabel: "0.6–1.2",
      },
      {
        id: "bun",
        name: "BUN",
        value: 22,
        unit: "mg/dL",
        previousValue: 20,
        flag: "elevated",
        note: "Mildly above range",
        referenceLabel: "7–20",
      },
      {
        id: "potassium",
        name: "Potassium",
        value: 4.6,
        unit: "mEq/L",
        previousValue: 4.4,
        flag: "normal",
        note: "Within your usual range",
        referenceLabel: "3.5–5.0",
      },
      {
        id: "sodium",
        name: "Sodium",
        value: 138,
        unit: "mEq/L",
        previousValue: 139,
        flag: "normal",
        note: "Stable",
        referenceLabel: "135–145",
      },
      {
        id: "albumin",
        name: "Albumin",
        value: 3.9,
        unit: "g/dL",
        previousValue: 4.0,
        flag: "normal",
        note: "Holding steady",
        referenceLabel: "3.4–5.4",
      },
    ],
  },
  influence: {
    footnote: "Readings in the last 3 days mattered most",
    factors: [
      {
        id: "f1",
        label: "Blood pressure trend",
        weight: "major",
        impactPercent: 88,
        icon: "bp",
      },
      {
        id: "f2",
        label: "Creatinine level",
        weight: "major",
        impactPercent: 76,
        icon: "creatinine",
      },
      {
        id: "f3",
        label: "Blood sugar / diabetes history",
        weight: "moderate",
        impactPercent: 54,
        icon: "glucose",
      },
      {
        id: "f4",
        label: "Medication adherence",
        weight: "moderate",
        impactPercent: 41,
        icon: "meds",
      },
    ],
  },
  tasks: [
    {
      id: "t1",
      label: "Take morning medication",
      completed: true,
      category: "medication",
    },
    {
      id: "t2",
      label: "Log blood pressure",
      completed: true,
      category: "vitals",
    },
    {
      id: "t3",
      label: "Drink water (6 of 8 glasses)",
      completed: false,
      category: "hydration",
    },
    {
      id: "t4",
      label: "Evening medication reminder",
      completed: false,
      category: "medication",
    },
    {
      id: "t5",
      label: "Upcoming creatinine lab — book slot",
      completed: false,
      category: "lab",
    },
  ],
  careTeam: {
    clinicianName: "Dr. Priya Mehta",
    specialty: "Nephrology",
    initials: "PM",
    nextAppointment: {
      dateLabel: "Fri, 26 Sep 2026",
      timeLabel: "10:30 AM",
      mode: "video",
    },
    lastNotePreview:
      "Keep logging BP twice daily. Reduce added salt this week and message if systolic stays above 140.",
  },
  healthTip: {
    id: "tip-1",
    title: "Watch the hidden salt",
    body: "Packaged soups, pickles, and sauces can raise fluid retention. Choosing lower-sodium options helps protect kidney function over time.",
    topic: "Nutrition",
  },
  onboardingSteps: [
    {
      id: "o1",
      label: "Complete your profile",
      description: "Add basic health details and emergency contact.",
      completed: true,
    },
    {
      id: "o2",
      label: "Give consent",
      description: "Review how your data supports clinical decisions.",
      completed: false,
    },
    {
      id: "o3",
      label: "Pair a device",
      description: "Connect a BP monitor or wearable for automatic vitals.",
      completed: false,
    },
    {
      id: "o4",
      label: "Add recent labs",
      description: "Upload or enter your latest kidney-related results.",
      completed: false,
    },
  ],
}

/** Alternate scenarios for QA / demos — swap into the page as needed. */
export const dashboardScenarios = {
  firstTime: {
    ...patientDashboardMock,
    meta: {
      ...patientDashboardMock.meta,
      isFirstTimeUser: true,
      devicePaired: false,
      notificationCount: 1,
    },
  },
  noDevice: {
    ...patientDashboardMock,
    meta: { ...patientDashboardMock.meta, devicePaired: false },
    vitals: patientDashboardMock.vitals.map((v) => ({
      ...v,
      value: null,
      timestamp: null,
      flag: null,
      sparkline: [],
      hint: undefined,
      secondary: undefined,
      progressPercent: undefined,
    })),
  },
  awaitingReview: {
    ...patientDashboardMock,
    kidneyHealth: {
      ...patientDashboardMock.kidneyHealth,
      reviewStatus: "under_review" as const,
      clinicianName: undefined,
    },
  },
  offline: {
    ...patientDashboardMock,
    meta: {
      ...patientDashboardMock.meta,
      syncStatus: "failed" as const,
      lastSyncAt: "Yesterday, 6:40 PM",
    },
  },
  highRisk: {
    ...patientDashboardMock,
    kidneyHealth: {
      ...patientDashboardMock.kidneyHealth,
      trafficLight: "contact_doctor" as const,
      stageLabel: "Stage 4",
      egfr: 28,
      trend: "worsening" as const,
      isHighRisk: true,
      reviewStatus: "reviewed" as const,
      clinicianName: "Dr. Mehta",
    },
  },
} as const
