"use client"

import { Card, CardContent } from "@/components/ui/card"

interface WarningWidgetProps {
  level?: "SAFE" | "WARNING" | "DANGER"
  since?: Date
}

export function WarningWidget({ 
  level = "DANGER",
  since = new Date("2026-01-17T16:00:00") 
}: WarningWidgetProps) {
  const colorClass =
    level === "SAFE"
      ? "text-green-500"
      : level === "WARNING"
      ? "text-yellow-400"
      : "text-danger"

  const formattedDate = since.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  
  const formattedTime = since.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <Card className="h-full flex-1 basis-1/3 min-h-[15vh] flex flex-col">
      <CardContent className="flex items-center justify-center h-full flex-1">
        <div className="flex flex-col items-center justify-center">
          <div className={`text-4xl sm:text-5xl font-bold ${colorClass}`}>{level}</div>
          <div className="text-muted-foreground mt-2 text-sm sm:text-base">
            Since: {formattedDate}, {formattedTime}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
