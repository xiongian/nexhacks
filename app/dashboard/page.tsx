"use client"

import { WarningWidget } from "@/components/dashboard/WarningWidget"
import { AISummary } from "@/components/dashboard/SituationSummary"
import { VideoFeed } from "@/components/dashboard/VideoFeed"
import { PersonLocator } from "@/components/dashboard/PersonLocator"
import { useOvershootVision } from "@/components/dashboard/useOvershootVision"

export default function DashboardPage() {
  const username = "User"
  const { currentResult, error, startVision, stopVision, isActive, videoRef } = useOvershootVision()

  // Use vision results if available, otherwise fallback to defaults
  const warningData = currentResult ? {
    level: currentResult.dangerLevel >= 7 ? "DANGER" :
           currentResult.dangerLevel >= 4 ? "WARNING" : "SAFE",
    since: currentResult.timestamp,
  } : {
    level: "SAFE",
    since: new Date(),
  }

  const summaryData = currentResult ? {
    title: `AI Analysis - Threat Level ${currentResult.dangerLevel}/10`,
    description: currentResult.text,
  } : {
    title: "AI Vision Analysis",
    description: "Waiting for camera analysis... Click start to begin monitoring.",
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

        {/* Controls */}
        <div className="mb-6 flex gap-4 items-center">
          <button
            onClick={isActive ? stopVision : startVision}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isActive ? 'Stop Vision Analysis' : 'Start Vision Analysis'}
          </button>
          {error && (
            <span className="text-red-500 text-sm">{error}</span>
          )}
          {isActive && (
            <span className="text-green-500 text-sm">Vision analysis active</span>
          )}
        </div>

        {/* First row: Warning Widget + AI Summary */}
        <div className="flex flex-row gap-4 sm:gap-6 mb-4 sm:mb-6 min-h-[30vh]">
          <WarningWidget level={warningData.level} since={warningData.since} />
          <AISummary title={summaryData.title} description={summaryData.description} />
        </div>

        {/* Second row: Video Feed + Person Locator */}
        <div className="flex flex-row gap-4 sm:gap-6 min-h-[60vh]">
          <VideoFeed ref={videoRef} isActive={isActive} />
          <PersonLocator grid={personGrid} />
        </div>
      </div>
    </div>
  )
}
