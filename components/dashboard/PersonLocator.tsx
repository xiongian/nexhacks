"use client"

import { Card, CardContent } from "@/components/ui/card"

interface PersonLocatorProps {
  // 3x3 binary array: true = person detected, false = no person
  grid?: boolean[][]
}

const defaultGrid = [
  [false, true, false],
  [false, false, false],
  [false, false, true],
]

export function PersonLocator({ grid = defaultGrid }: PersonLocatorProps) {
  return (
    <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1 flex flex-col">
      <CardContent className="flex items-center justify-center h-full flex-1 p-4">
        <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] aspect-square">
          {grid.flat().map((hasPersonDetected, index) => (
            <div
              key={index}
              className={`rounded-md transition-colors ${
                hasPersonDetected ? "bg-danger" : "bg-background"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
