"use client"

import { useEffect, useState } from "react"
import { parseOvershootResult } from "./parseOvershootResult"
import type {
  DangerLevel,
  OvershootResult,
  OvershootVisionConstructor,
  OvershootVisionInstance,
} from "./types"

const createSectionPrompt = (section: string) =>
  `You are monitoring a CCTV feed inside a room, focusing on the ${section} section from the camera.

Level = "DANGER" if there is any physical fight, aggressive gestures (hitting, pushing, frantic arm movements), hands on neck, gun-like gesture near head, or distress caused by another person; "WARNING" if no fight but someone appears shocked or scared; "SAFE" if everyone is calm.

Respond ONLY with a JSON object: {"level": "SAFE" | "WARNING" | "DANGER", "summary": string, "points": [[x, y], ...]} explaining the choice.

Points are integer coordinates (0–9) for each person on a 10×10 bird's-eye grid of the room, focusing on the ${section} section.

Focus your assessment ONLY on the ${section} section from the camera.`

const SECTION_PROMPTS = {
  farthest: createSectionPrompt("farthest"),
  middle: createSectionPrompt("middle"),
  closest: createSectionPrompt("closest"),
} as const

type SectionResult = {
  summary: string
  grid: boolean[][]
  level: DangerLevel
  rawText: string
}

type UseOvershootVisionResult = {
  sections: {
    farthest: SectionResult | null
    middle: SectionResult | null
    closest: SectionResult | null
  }
  overallDangerLevel: DangerLevel
  dangerSince: Date
  isMonitoring: boolean
  setIsMonitoring: (value: boolean | ((prev: boolean) => boolean)) => void
}

export function useOvershootVision(): UseOvershootVisionResult {
  const [sections, setSections] = useState<{
    farthest: SectionResult | null
    middle: SectionResult | null
    closest: SectionResult | null
  }>({
    farthest: null,
    middle: null,
    closest: null,
  })
  const [overallDangerLevel, setOverallDangerLevel] = useState<DangerLevel>("SAFE")
  const [dangerSince, setDangerSince] = useState<Date>(new Date())
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    if (!isMonitoring) {
      return
    }

    let cancelled = false
    const visions: OvershootVisionInstance[] = []

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

      const sectionKeys = ['farthest', 'middle', 'closest'] as const

      // Create and start 3 separate instances
      for (const section of sectionKeys) {
        if (cancelled) {
          break
        }

        const instance = new RealtimeVision({
          apiUrl: "https://cluster1.overshoot.ai/api/v0.2",
          apiKey,
          prompt: SECTION_PROMPTS[section],
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

            console.log(`${section} section description:`, parsed.summary)

            setSections(prev => ({
              ...prev,
              [section]: {
                summary: parsed.summary,
                grid: parsed.grid,
                level: parsed.level,
                rawText: text,
              }
            }))

            // Update overall danger level based on the highest danger level across sections
            setSections(currentSections => {
              const allLevels = Object.values(currentSections)
                .filter(s => s !== null)
                .map(s => s!.level)

              const highestLevel = allLevels.includes("DANGER") ? "DANGER" :
                                 allLevels.includes("WARNING") ? "WARNING" : "SAFE"

              setOverallDangerLevel(highestLevel)
              setDangerSince(new Date())

              return currentSections
            })
          },
        })

        visions.push(instance)
        await instance.start()
      }
    }

    run()

    return () => {
      cancelled = true

      for (const vision of visions) {
        vision.stop().catch(() => {})
      }
    }
  }, [isMonitoring])

  return {
    sections,
    overallDangerLevel,
    dangerSince,
    isMonitoring,
    setIsMonitoring,
  }
}