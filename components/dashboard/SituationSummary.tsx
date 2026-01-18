"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AISummaryProps {
  title?: string
  parsed?: { text?: string }
}

export function AISummary({
  title = "AI Brief Summary of What's going",
  parsed
}: AISummaryProps) {

  return (
    <Card className="h-full flex-[2] basis-2/3 min-h-[30vh]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed text-sm sm:text-base">{parsed?.text}</p>
      </CardContent>
    </Card>
  )
}
