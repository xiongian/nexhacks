"use client"

import { Card, CardContent } from "@/components/ui/card"
import { forwardRef } from "react"

interface VideoFeedProps {
  streamUrl?: string
  isActive?: boolean
}

export const VideoFeed = forwardRef<HTMLVideoElement, VideoFeedProps>(
  ({ streamUrl, isActive = false }, ref) => {
    return (
      <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1 flex flex-col">
        <CardContent className="flex items-center justify-center h-full flex-1 p-0 relative">
          <video
            ref={ref}
            src={streamUrl}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-2xl"
          />
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
              <span className="text-white text-lg">Camera Inactive</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

VideoFeed.displayName = "VideoFeed"
