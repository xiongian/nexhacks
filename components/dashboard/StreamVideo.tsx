"use client"

import { Card, CardContent } from "@/components/ui/card"

export function StreamVideo() {
  return (
    <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1">
      <CardContent className="flex items-center justify-center h-full p-0">
        <div className="w-full h-3/4 bg-transparent rounded-2xl flex items-center justify-center">
        <span className="text-black text-6xl font-bold text-center">
              Stream Not Available
            </span>
        </div>
      </CardContent>
    </Card>
  )
}