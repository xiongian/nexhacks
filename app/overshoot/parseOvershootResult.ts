import type { DangerLevel, OvershootParsed } from "./types"

export function parseOvershootResult(text: string): OvershootParsed | null {
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
