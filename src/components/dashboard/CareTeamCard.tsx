import {
  CalendarIcon,
  MessageSquareIcon,
  VideoIcon,
  MapPinIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CareTeam } from "@/data/patient-dashboard-mock"

interface CareTeamCardProps {
  careTeam: CareTeam
}

export function CareTeamCard({ careTeam }: CareTeamCardProps) {
  const modeLabel =
    careTeam.nextAppointment.mode === "video" ? "Video visit" : "In person"
  const ModeIcon =
    careTeam.nextAppointment.mode === "video" ? VideoIcon : MapPinIcon

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Care team & next appointment</CardTitle>
        <CardDescription>Your assigned clinician</CardDescription>
      </CardHeader>
      <CardContent className="gap-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {careTeam.photoUrl ? (
              <AvatarImage src={careTeam.photoUrl} alt="" />
            ) : null}
            <AvatarFallback>{careTeam.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium">{careTeam.clinicianName}</p>
            <p className="text-sm text-muted-foreground">{careTeam.specialty}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">Next appointment</span>
            <Badge variant="secondary" className="gap-1">
              <ModeIcon className="size-3" />
              {modeLabel}
            </Badge>
          </div>
          <p className="text-sm">
            {careTeam.nextAppointment.dateLabel}
            <span className="mx-1.5 text-muted-foreground">·</span>
            {careTeam.nextAppointment.timeLabel}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Last clinician note
          </p>
          <p className="text-sm text-muted-foreground">
            {careTeam.lastNotePreview}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t">
        <Button size="sm" aria-label="Message your clinician">
          <MessageSquareIcon />
          Message
        </Button>
        <Button size="sm" variant="outline" aria-label="Reschedule appointment">
          Reschedule
        </Button>
      </CardFooter>
    </Card>
  )
}
