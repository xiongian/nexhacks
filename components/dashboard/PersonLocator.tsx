"use client"

import { Card, CardContent } from "@/components/ui/card"

interface PersonLocatorProps {
  grid?: (string | null)[][]
}

const defaultGrid = Array.from({ length: 10 }, () =>
  Array(10).fill(null)
)

export function PersonLocator({ grid = defaultGrid }: PersonLocatorProps) {
  const columns = grid[0]?.length ?? 0
  const cells = grid.flat()

  const getCellColor = (dangerLevel: string | null) => {
    switch (dangerLevel) {
      case "DANGER":
        return "bg-danger"
      case "WARNING":
        return "bg-warning"
      case "SAFE":
        return "bg-background"
      default:
        return "bg-background"
    }
  }

  return (
    <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1 flex flex-col">
      <CardContent className="flex items-center justify-center h-full flex-1 p-4">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
          className="gap-1 w-full max-w-[280px] aspect-square"
        >
          {cells.map((dangerLevel, index) => (
            <div
              key={index}
              className={`rounded-md transition-colors ${getCellColor(dangerLevel)}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
