"use client"

import { useEffect, useState } from "react"

import { WarningWidget } from "@/components/dashboard/WarningWidget"
import { AISummary } from "@/components/dashboard/SituationSummary"
import { VideoFeed } from "@/components/dashboard/VideoFeed"
import { PersonLocator } from "@/components/dashboard/PersonLocator"

type DangerLevel = "SAFE" | "WARNING" | "DANGER"

type OvershootParsed = {
  level: DangerLevel
  summary: string
  grid: boolean[][]
}

type OvershootResult = {
  result?: string
}

type OvershootVisionInstance = {
  start: () => Promise<void>
  stop: () => Promise<void>
}

type OvershootVisionConstructor = new (options: {
  apiUrl: string
  apiKey: string
  prompt: string
  onResult: (result: OvershootResult) => void
}) => OvershootVisionInstance

function parseOvershootResult(text: string): OvershootParsed | null {
  try {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")

    if (start === -1 || end === -1 || end <= start) {
      return null
    }

    const segment = text.slice(start, end + 1)
    const data: unknown = JSON.parse(segment)

    if (!data || typeof data !== "object") {
      return null
    }

    const record = data as Record<string, unknown>

    const rawLevel =
      typeof record.level === "string" ? record.level.toUpperCase() : ""

    let level: DangerLevel

    if (rawLevel === "SAFE" || rawLevel === "WARNING" || rawLevel === "DANGER") {
      level = rawLevel
    } else {
      level = "SAFE"
    }

    const summary =
      typeof record.summary === "string" ? record.summary : ""
    const points = Array.isArray(record.points) ? record.points : []

    const size = 10
    const grid: boolean[][] = Array.from({ length: size }, () =>
      Array(size).fill(false)
    )

    for (const entry of points) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        continue
      }

      const [rawX, rawY] = entry
      const x = Number(rawX)
      const y = Number(rawY)

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        continue
      }

      const ix = Math.min(size - 1, Math.max(0, Math.round(x)))
      const iy = Math.min(size - 1, Math.max(0, Math.round(y)))

      grid[iy][ix] = true
    }

    return {
      level,
      summary,
      grid,
    }
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const username = "User"

  const defaultSummary =
    "Longer description of ongoing danger, namely the cause, person(s), threat level, time of detection"

  const [summaryDescription, setSummaryDescription] = useState(defaultSummary)
  const [personGrid, setPersonGrid] = useState<boolean[][]>(() =>
    Array.from({ length: 10 }, () => Array(10).fill(false))
  )
  const [dangerLevel, setDangerLevel] = useState<DangerLevel>("SAFE")
  const [dangerSince, setDangerSince] = useState<Date>(new Date())
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (!isMonitoring || !remoteStream) {
      return
    }

    let cancelled = false
    let vision: OvershootVisionInstance | null = null

    async function run() {
      const apiKey = process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY

      if (!apiKey) {
        return
      }

      const sdkModule = (await import("@overshoot/sdk")) as {
        RealtimeVision: OvershootVisionConstructor
      }

      if (cancelled) {
        return
      }

      const { RealtimeVision } = sdkModule

      const instance = new RealtimeVision({
        apiUrl: "https://cluster1.overshoot.ai/api/v0.2",
        apiKey,
        prompt:
          'You are monitoring a CCTV feed for safety inside a room. Classify the current situation into a single level using these rules: (1) level = "DANGER" if you see any physical fight, hitting, pushing, shoving, or if anyone is aggressively waving their arms up and down or making frantic, alarming motions; (2) level = "WARNING" if there is no fight, but anyone looks extremely surprised, shocked, or scared (for example wide eyes, hands to face, sudden startled reactions); (3) level = "SAFE" if people appear calm and no one looks surprised, scared, or fighting. Respond ONLY with a single JSON object of the form {"level": "SAFE" | "WARNING" | "DANGER", "summary": string, "points": [[x, y], ...]}. summary must be a short sentence describing what is happening and why that level was chosen. points must be a list of [x, y] coordinates for each person in the scene, where you imagine a bird\'s eye view of the room mapped to a 10 by 10 grid. x and y must be integers between 0 and 9 inclusive, where [0,0] is one corner of the room and [9,9] is the opposite corner.',
        onResult: (result: OvershootResult) => {
          if (cancelled) {
            return
          }

          const text =
            typeof result.result === "string" ? result.result : ""

          if (!text.trim()) {
            return
          }

          const parsed = parseOvershootResult(text)

          if (!parsed) {
            return
          }

          if (parsed.summary) {
            setSummaryDescription(parsed.summary)
          }

          setPersonGrid(parsed.grid)
          setDangerLevel(parsed.level)
          setDangerSince(new Date())
        },
      })

      vision = instance

      await instance.start()
    }

    run()

    return () => {
      cancelled = true

      if (vision) {
        vision.stop().catch(() => {})
      }
    }
  }, [isMonitoring, remoteStream])

  // Use person grid from state for person locator
  const combinedPersonGrid = personGrid

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
            parsed={{ text: summaryDescription }}
          />
        </div>

        <div className="flex flex-row gap-4 sm:gap-6 min-h-[60vh]">
          <div className="flex flex-col flex-1 gap-3">
            <VideoFeed 
              active={isMonitoring} 
              onStreamReady={(stream) => setRemoteStream(stream)}
            />
            <button
              type="button"
              onClick={() => setIsMonitoring((value) => !value)}
              className="self-start px-4 py-2 text-xs sm:text-sm bg-danger text-foreground border border-[#000000] border-[0.0625rem]"
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </button>
          </div>
          <PersonLocator grid={combinedPersonGrid} />
        </div>
      </div>
    </div>
  )
}
