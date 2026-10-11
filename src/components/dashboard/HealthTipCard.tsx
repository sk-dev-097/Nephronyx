import { BookOpenIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { HealthTip } from "@/data/patient-dashboard-mock"

interface HealthTipCardProps {
  tip: HealthTip
}

export function HealthTipCard({ tip }: HealthTipCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardDescription>{tip.topic}</CardDescription>
        <CardTitle>Health tip</CardTitle>
      </CardHeader>
      <CardContent className="gap-2 pt-4">
        <h3 className="font-medium">{tip.title}</h3>
        <p className="text-sm text-muted-foreground">{tip.body}</p>
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="outline" size="sm" aria-label="Read more about this tip in Learn">
          <BookOpenIcon />
          Read more
        </Button>
      </CardFooter>
    </Card>
  )
}
