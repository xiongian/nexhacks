"use client"

import { WarningWidget } from "@/components/dashboard/WarningWidget"
import { AISummary } from "@/components/dashboard/SituationSummary"
import { VideoFeed } from "@/components/dashboard/VideoFeed"
import { PersonLocator } from "@/components/dashboard/PersonLocator"

export default function DashboardPage() {
  // Placeholder data - will be replaced with API calls
  const username = "User"
  
  const warningData = {
    level: "DANGER",
    since: new Date("2026-01-17T16:00:00"),
  }
  
  const summaryData = {
    title: "AI Brief Summary of What's going",
    description: "Longer description of ongoing danger, namely the cause, person(s), threat level, time of detection",
  }
  
  const personGrid = [
    [false, true, false],
    [false, false, false],
    [false, false, true],
  ]

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-5xl sm:text-6xl font-light text-foreground mb-8">
          Welcome {username}.
        </h1>

        {/* First row: Warning Widget + AI Summary */}
        <div className="flex flex-row gap-4 sm:gap-6 mb-4 sm:mb-6 min-h-[30vh]">
          <WarningWidget level={warningData.level} since={warningData.since} />
          <AISummary title={summaryData.title} description={summaryData.description} />
        </div>

        {/* Second row: Video Feed + Person Locator */}
        <div className="flex flex-row gap-4 sm:gap-6 min-h-[60vh]">
          <VideoFeed />
          <PersonLocator grid={personGrid} />
        </div>
      </div>
    </div>
  )
}
