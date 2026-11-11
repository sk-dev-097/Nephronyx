import { useEffect, useState } from "react"
import { CheckCircle2, Pencil, Plug, Save, X } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { CareTeamCard } from "@/components/dashboard/CareTeamCard"
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar"
import { DisclaimerBanner } from "@/components/dashboard/DisclaimerBanner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { patientDashboardMock } from "@/data/patient-dashboard-mock"
import {
    patientProfileMock,
    type PatientProfileData,
    type ProfileField,
} from "./data/patient-profile-mock"

function loadProfile(): PatientProfileData {
    return patientProfileMock
}

/* ---------- Small building blocks ---------- */

function FieldGrid({
    fields,
    editing,
    onChange,
}: {
    fields: ProfileField[]
    editing: boolean
    onChange: (id: string, value: string) => void
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
                <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={f.id} className="text-muted-foreground text-xs">
                        {f.label}
                    </Label>
                    {editing ? (
                        <Input
                            id={f.id}
                            type={f.type ?? "text"}
                            value={f.value}
                            onChange={(e) => onChange(f.id, e.target.value)}
                        />
                    ) : (
                        <p id={f.id} className="text-sm font-medium">
                            {f.value || "—"}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}

function ProfileHeaderCard({
    identity,
    editing,
    onEdit,
    onSave,
    onCancel,
}: {
    identity: PatientProfileData["identity"]
    editing: boolean
    onEdit: () => void
    onSave: () => void
    onCancel: () => void
}) {
    return (
        <Card className="col-span-full">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="size-16">
                        <AvatarFallback className="text-lg">{identity.initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold">{identity.fullName}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{identity.ckdStage}</Badge>
                            <span className="text-muted-foreground text-xs">
                                ID {identity.patientId} • Member since {identity.memberSince}
                            </span>
                        </div>
                    </div>
                </div>

                {editing ? (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel}>
                            <X className="size-4" /> Cancel
                        </Button>
                        <Button onClick={onSave}>
                            <Save className="size-4" /> Save changes
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" onClick={onEdit}>
                        <Pencil className="size-4" /> Edit profile
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

function PersonalInfoCard(props: {
    fields: ProfileField[]
    editing: boolean
    onChange: (id: string, value: string) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Used to personalise your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <FieldGrid {...props} />
            </CardContent>
        </Card>
    )
}

function EmergencyContactCard(props: {
    fields: ProfileField[]
    editing: boolean
    onChange: (id: string, value: string) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Emergency contact</CardTitle>
                <CardDescription>Who your care team should call first.</CardDescription>
            </CardHeader>
            <CardContent>
                <FieldGrid {...props} />
            </CardContent>
        </Card>
    )
}

function MedicalInfoCard({ medical }: { medical: PatientProfileData["medical"] }) {
    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Medical information</CardTitle>
                <CardDescription>Managed by your care team. Message them to request changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <p className="text-muted-foreground text-xs">Conditions</p>
                        <div className="flex flex-wrap gap-2">
                            {medical.conditions.map((c) => (
                                <Badge key={c} variant="secondary">{c}</Badge>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-muted-foreground text-xs">Allergies</p>
                        <div className="flex flex-wrap gap-2">
                            {medical.allergies.length ? (
                                medical.allergies.map((a) => (
                                    <Badge key={a} variant="destructive">{a}</Badge>
                                ))
                            ) : (
                                <span className="text-sm">None recorded</span>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <p className="text-muted-foreground text-xs">Current medications</p>
                    <ul className="divide-y rounded-md border">
                        {medical.medications.map((m) => (
                            <li key={m.name} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-sm font-medium">
                                    {m.name} <span className="text-muted-foreground font-normal">{m.dose}</span>
                                </span>
                                <span className="text-muted-foreground text-sm">{m.schedule}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Dietary notes</p>
                    <p className="text-sm">{medical.dietaryNotes}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function ConnectedDevicesCard({ devices }: { devices: PatientProfileData["devices"] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Connected devices</CardTitle>
                <CardDescription>Devices that send vitals to your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {devices.map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <div className="flex items-center gap-3">
                            {d.status === "connected" ? (
                                <CheckCircle2 className="size-5 text-green-600" />
                            ) : (
                                <Plug className="text-muted-foreground size-5" />
                            )}
                            <div>
                                <p className="text-sm font-medium">{d.name}</p>
                                <p className="text-muted-foreground text-xs">Last sync: {d.lastSync}</p>
                            </div>
                        </div>
                        {d.status === "connected" ? (
                            <Badge variant="secondary">Connected</Badge>
                        ) : (
                            <Button size="sm" variant="outline">Reconnect</Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function PreferencesCard({
    preferences,
    onToggle,
}: {
    preferences: PatientProfileData["preferences"]
    onToggle: (id: string, enabled: boolean) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification preferences</CardTitle>
                <CardDescription>Choose what you hear about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {preferences.map((p, i) => (
                    <div key={p.id}>
                        {i > 0 && <Separator className="mb-4" />}
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                                <Label htmlFor={p.id} className="text-sm font-medium">{p.label}</Label>
                                <p className="text-muted-foreground text-xs">{p.description}</p>
                            </div>
                            <Switch
                                id={p.id}
                                checked={p.enabled}
                                onCheckedChange={(v) => onToggle(p.id, v)}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function ProfileSkeleton() {
    return (
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-2 md:gap-6 md:px-6">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-48 animate-pulse rounded-xl bg-muted ${i === 0 ? "col-span-full h-28" : ""}`} />
            ))}
        </div>
    )
}

/* ---------- Page body ---------- */

function ProfileBody({ initial }: { initial: PatientProfileData }) {
    const [data, setData] = useState(initial)
    const [draft, setDraft] = useState(initial)
    const [editing, setEditing] = useState(false)

    const current = editing ? draft : data
    const { meta, identity } = data

    const updateField = (
        section: "personal" | "emergencyContact",
        id: string,
        value: string,
    ) =>
        setDraft((d) => ({
            ...d,
            [section]: d[section].map((f) => (f.id === id ? { ...f, value } : f)),
        }))

    const handleSave = () => {
        setData({
            ...draft,
            meta: { ...draft.meta, lastUpdatedLabel: "Profile updated just now" },
        })
        setEditing(false)
    }

    const handleCancel = () => {
        setDraft(data)
        setEditing(false)
    }

    const togglePreference = (id: string, enabled: boolean) => {
        const apply = (d: PatientProfileData) => ({
            ...d,
            preferences: d.preferences.map((p) => (p.id === id ? { ...p, enabled } : p)),
        })
        setData(apply)
        setDraft(apply)
    }

    return (
        <>
            <DashboardTopBar
                patient={patientDashboardMock.patient}
                dateLabel={meta.currentDateLabel}
                lastUpdatedLabel={meta.lastUpdatedLabel}
                notificationCount={meta.notificationCount}
            />
            <DisclaimerBanner />

            <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
                <h2 className="sr-only">Patient profile</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    <ProfileHeaderCard
                        identity={identity}
                        editing={editing}
                        onEdit={() => {
                            setDraft(data)
                            setEditing(true)
                        }}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />

                    <PersonalInfoCard
                        fields={current.personal}
                        editing={editing}
                        onChange={(id, v) => updateField("personal", id, v)}
                    />
                    <EmergencyContactCard
                        fields={current.emergencyContact}
                        editing={editing}
                        onChange={(id, v) => updateField("emergencyContact", id, v)}
                    />

                    <MedicalInfoCard medical={data.medical} />

                    <ConnectedDevicesCard devices={data.devices} />
                    <PreferencesCard
                        preferences={current.preferences}
                        onToggle={togglePreference}
                    />

                    <div className="col-span-full">
                        <CareTeamCard careTeam={patientDashboardMock.careTeam} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default function PatientProfile() {
    const [data, setData] = useState<PatientProfileData | null>(null)

    useEffect(() => {
        const timer = window.setTimeout(() => setData(loadProfile()), 450)
        return () => window.clearTimeout(timer)
    }, [])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {!data ? (
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
                        <ProfileSkeleton />
                    </>
                ) : (
                    <ProfileBody initial={data} />
                )}
            </SidebarInset>
        </SidebarProvider>
    )
}