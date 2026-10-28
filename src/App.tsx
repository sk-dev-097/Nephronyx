import { useEffect, useState } from "react"

import CheckStatusPage from "@/pages/patient/monitor/check_status"
import PatientDashboard from "@/pages/Dashboard/patient_dashboard"

function useHashRoute() {
  const [hash, setHash] = useState(
    () => window.location.hash || "#/"
  )

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash || "#/")
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  return hash
}

export function App() {
  const hash = useHashRoute()

  if (hash.startsWith("#/monitor/check-status")) {
    return <CheckStatusPage />
  }

  return <PatientDashboard />
}

export default App
