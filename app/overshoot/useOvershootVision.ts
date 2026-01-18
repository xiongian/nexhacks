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
  "Give a 3 part summary, containing a danger level for what is happening furthest, middle, and closet from the camera, in 3 different lines \n\n"
  "and provide a threat level for each distance from the camera"

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
  rawText: string
}

export function useOvershootVision(): UseOvershootVisionResult {
  const [summaryDescription, setSummaryDescription] = useState(DEFAULT_SUMMARY)
  const [personGrid, setPersonGrid] = useState<boolean[][]>(() =>
    Array.from({ length: 10 }, () => Array(10).fill(false))
  )
  const [dangerLevel, setDangerLevel] = useState<DangerLevel>("SAFE")
  const [dangerSince, setDangerSince] = useState<Date>(new Date())
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [rawText, setRawText] = useState("")

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

          setRawText(text)

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

          // Call the SMS alert API endpoint with danger detection data
          if (parsed.summary) {
            fetch('/api/sms/alert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dangerLevel: parsed.level,
                description: parsed.summary,
                personGrid: parsed.grid,
              }),
            }).catch((error) => {
              console.error('[Dashboard] Failed to call alert API:', error)
            })
          }
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
    rawText,
  }
}
