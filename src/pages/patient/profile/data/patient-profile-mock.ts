export type ProfileField = { id: string; label: string; value: string; type?: string }

export type PatientProfileData = {
    meta: { currentDateLabel: string; lastUpdatedLabel: string; notificationCount: number }
    identity: {
        fullName: string
        initials: string
        patientId: string
        ckdStage: string
        memberSince: string
    }
    personal: ProfileField[]
    medical: {
        conditions: string[]
        allergies: string[]
        medications: { name: string; dose: string; schedule: string }[]
        dietaryNotes: string
    }
    emergencyContact: ProfileField[]
    devices: { name: string; status: "connected" | "disconnected"; lastSync: string }[]
    preferences: { id: string; label: string; description: string; enabled: boolean }[]
}

export const patientProfileMock: PatientProfileData = {
    meta: {
        currentDateLabel: "Wednesday, 11 November 2026",
        lastUpdatedLabel: "Profile updated 3 days ago",
        notificationCount: 2,
    },
    identity: {
        fullName: "Arun Kumar",
        initials: "AK",
        patientId: "PT-004821",
        ckdStage: "CKD Stage 3a",
        memberSince: "March 2025",
    },
    personal: [
        { id: "fullName", label: "Full name", value: "Arun Kumar" },
        { id: "dob", label: "Date of birth", value: "1968-04-12", type: "date" },
        { id: "gender", label: "Gender", value: "Male" },
        { id: "phone", label: "Phone", value: "+91 98765 43210", type: "tel" },
        { id: "email", label: "Email", value: "arun.kumar@example.com", type: "email" },
        { id: "address", label: "City", value: "Salem, Tamil Nadu" },
    ],
    medical: {
        conditions: ["Chronic kidney disease", "Hypertension", "Type 2 diabetes"],
        allergies: ["Penicillin"],
        medications: [
            { name: "Telmisartan", dose: "40 mg", schedule: "Once daily, morning" },
            { name: "Metformin", dose: "500 mg", schedule: "Twice daily, with meals" },
        ],
        dietaryNotes: "Low sodium, controlled potassium and phosphorus.",
    },
    emergencyContact: [
        { id: "ecName", label: "Contact name", value: "Meena Kumar" },
        { id: "ecRelation", label: "Relationship", value: "Spouse" },
        { id: "ecPhone", label: "Contact phone", value: "+91 98765 11122", type: "tel" },
    ],
    devices: [
        { name: "Blood pressure monitor", status: "connected", lastSync: "Today, 7:45 AM" },
        { name: "Smart scale", status: "disconnected", lastSync: "5 days ago" },
    ],
    preferences: [
        { id: "reminders", label: "Medication reminders", description: "Get a reminder when a dose is due.", enabled: true },
        { id: "labAlerts", label: "Lab result alerts", description: "Be notified when new lab values arrive.", enabled: true },
        { id: "weekly", label: "Weekly summary email", description: "A short summary of your vitals each week.", enabled: false },
    ],
}