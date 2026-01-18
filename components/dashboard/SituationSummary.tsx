"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AISummaryProps {
  title?: string
  description?: string
}

export function AISummary({ 
  title = "AI Brief Summary of What's going", 
  description = "Longer description of ongoing danger, namely the cause, person(s), threat level, time of detection" 
}: AISummaryProps) {
  return (
    <Card className="h-full flex-[2] basis-2/3 min-h-[30vh]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed text-sm sm:text-base">{description}</p>
      </CardContent>
    </Card>
  )
}
