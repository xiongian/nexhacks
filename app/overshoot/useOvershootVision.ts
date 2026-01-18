"use client"

import { useEffect, useState } from "react"
import { parseOvershootResult } from "./parseOvershootResult"
import type {
  DangerLevel,
  OvershootResult,
  OvershootVisionConstructor,
  OvershootVisionInstance,
} from "./types"

const OVERSHOOT_PROMPT =
  'You are monitoring a CCTV feed for safety inside a room. \n\n'
  'Classify the current situation into a single level using these rules: \n\n'
  '(1) level = "DANGER" if you see any physical fight, hitting, pushing, shoving, \n\n'
  'or if anyone is aggressively waving their arms up and down or making frantic, \n\n'
  'alarming motions, or if there are hands on their neck, or if there is a gun gesture \n\n'
  'near their head, or if their mouth is moving rapidly with a shocked face, or another person is pushing them; \n\n'
  '(2) level = "WARNING" if there is no fight, but anyone looks extremely surprised, shocked, or scared (for example wide eyes, \n\n'
  'hands to face, sudden startled reactions); (3) level = "SAFE" if people appear calm and no one looks surprised, scared, or fighting. \n\n'
  'Respond ONLY with a single JSON object of the form {"level": "SAFE" | "WARNING" | "DANGER", "summary": string, "points": [[x, y], ...]}. \n\n'
  'summary must be a short sentence describing what is happening and why that level was chosen. \n\n'
  'points must be a list of [x, y] coordinates for each person in the scene, where you imagine a bird\'s eye view of the room mapped to a 10 by 10 grid. \n\n'
  'x and y must be integers between 0 and 9 inclusive, where [0,0] is one corner of the room and [9,9] is the opposite corner.'

const DEFAULT_SUMMARY =
  "Longer description of ongoing danger, namely the cause, person(s), threat level, time of detection\n\n"
  "Give a 3 part summary, one for what is happening furthest, middle, and closet from the camera \n\n"
  "and provide a description, cause, person(s), and threat level for each distance from the camera"

type UseOvershootVisionResult = {
  summaryDescription: string
  personGrid: boolean[][]
  dangerLevel: DangerLevel
  dangerSince: Date
  isMonitoring: boolean
  setIsMonitoring: (value: boolean | ((prev: boolean) => boolean)) => void
}

export function useOvershootVision(): UseOvershootVisionResult {
  const [summaryDescription, setSummaryDescription] = useState(DEFAULT_SUMMARY)
  const [personGrid, setPersonGrid] = useState<boolean[][]>(() =>
    Array.from({ length: 10 }, () => Array(10).fill(false))
  )
  const [dangerLevel, setDangerLevel] = useState<DangerLevel>("SAFE")
  const [dangerSince, setDangerSince] = useState<Date>(new Date())
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    if (!isMonitoring) {
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
        prompt: OVERSHOOT_PROMPT,
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
  }, [isMonitoring])

  return {
    summaryDescription,
    personGrid,
    dangerLevel,
    dangerSince,
    isMonitoring,
    setIsMonitoring,
  }
}
