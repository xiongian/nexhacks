"use client"

import { useEffect, useRef } from "react"

import { Card, CardContent } from "@/components/ui/card"

interface VideoFeedProps {
  active: boolean
}

export function VideoFeed({ active }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!active) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      return
    }

    let cancelled = false

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [active])

  return (
    <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1">
      <CardContent className="flex items-center justify-center h-full-3/4 p-0 relative">
        <video
          ref={videoRef}
          id="camera"
          autoPlay
          muted
          playsInline
          className={`w-full h-3/4 object-cover rounded-2xl ${active ? 'bg-black' : 'bg-transparent'}`}
        />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black text-6xl font-bold text-center">
              Camera Not Recording
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
