"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SectionResult {
  summary: string
  grid: boolean[][]
  level: "SAFE" | "WARNING" | "DANGER"
  rawText: string
}

interface AISummaryProps {
  title?: string
  sections?: {
    farthest: SectionResult | null
    middle: SectionResult | null
    closest: SectionResult | null
  }
}

export function AISummary({
  title = "AI Brief Summary of What's going",
  sections
}: AISummaryProps) {
  // Combine all section summaries into one cohesive paragraph
  const combinedSummary = sections
    ? [
        sections.closest?.summary,
        sections.middle?.summary,
        sections.farthest?.summary
      ].filter(Boolean).join('. ').replace(/\.$/, '') + '.'
    : "Longer description of ongoing danger, namely the cause, person(s), threat level, time of detection"

  return (
    <Card className="h-full flex-[2] basis-2/3 min-h-[30vh]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed text-sm sm:text-base">{combinedSummary}</p>
      </CardContent>
    </Card>
  )
}
