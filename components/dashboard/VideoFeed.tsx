"use client"

import { Card, CardContent } from "@/components/ui/card"

interface VideoFeedProps {
  streamUrl?: string
}

export function VideoFeed({ streamUrl }: VideoFeedProps) {
  return (
    <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1">
      <CardContent className="flex items-center justify-center h-full p-0">
        {streamUrl ? (
          <video
            src={streamUrl}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          <span className="text-muted-foreground">Video Footage</span>
        )}
      </CardContent>
    </Card>
  )
}
