"use client"

import { WarningWidget } from "@/components/dashboard/WarningWidget"
import { AISummary } from "@/components/dashboard/SituationSummary"
import { VideoFeed } from "@/components/dashboard/VideoFeed"
import { PersonLocator } from "@/components/dashboard/PersonLocator"
import { useOvershootVision } from "@/app/overshoot"

export default function DashboardPage() {
  const username = "User"

  const {
    summaryDescription,
    personGrid,
    dangerLevel,
    dangerSince,
    isMonitoring,
    setIsMonitoring,
  } = useOvershootVision()

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-light text-foreground mb-8">
          Welcome {username}.
        </h1>

        <div className="flex flex-row gap-4 sm:gap-6 mb-4 sm:mb-6 min-h-[30vh]">
          <WarningWidget level={dangerLevel} since={dangerSince} />
          <AISummary
            title="AI Brief Summary of What's going"
            description={summaryDescription}
          />
        </div>

        <div className="flex flex-row gap-4 sm:gap-6 min-h-[60vh]">
          <div className="flex flex-col flex-1 gap-3">
            <VideoFeed active={isMonitoring} />
            <button
              type="button"
              onClick={() => setIsMonitoring((value) => !value)}
              className="self-start px-4 py-2 text-xs sm:text-sm bg-danger text-foreground border border-[#000000] border-[0.0625rem]"
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </button>
          </div>
          <PersonLocator grid={personGrid} />
        </div>
      </div>
    </div>
  )
}
