"use client"

import { useEffect, useRef, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"

interface VideoFeedProps {
  active: boolean
  onStreamReady?: (stream: MediaStream) => void
}

export function VideoFeed({ active, onStreamReady }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pollIntervalRef = useRef<number | null>(null)
  const lastFrameTimestampRef = useRef<number>(0)
  const [isConnected, setIsConnected] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)

  useEffect(() => {
    if (!active) {
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setIsConnected(false)
      setHasCamera(false)
      return
    }

    let cancelled = false

    // Poll for frames from API
    const pollForFrames = async () => {
      if (cancelled) return

      try {
        const response = await fetch("/api/camera/frame?cameraId=default")
        const data = await response.json()

        if (cancelled) return

        if (data.frame && data.frame.imageData) {
          // Check if this is a new frame
          if (data.frame.timestamp > lastFrameTimestampRef.current) {
            lastFrameTimestampRef.current = data.frame.timestamp

            if (!hasCamera) {
              setHasCamera(true)
            }
            setIsConnected(true)

            const video = videoRef.current
            const canvas = canvasRef.current

            if (!video || !canvas) return

            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const img = new Image()
            img.onload = () => {
              if (cancelled) return

              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)

              // Create a MediaStream from canvas for Overshoot SDK
              if (!streamRef.current && canvas.captureStream) {
                const stream = canvas.captureStream(30) // 30 FPS
                streamRef.current = stream
                video.srcObject = stream
                onStreamReady?.(stream)
              }
            }
            img.src = data.frame.imageData
          }
        } else {
          // No frame available
          if (hasCamera) {
            setHasCamera(false)
          }
        }
      } catch (error) {
        console.error("Error polling for frames:", error)
        if (hasCamera) {
          setHasCamera(false)
        }
      }
    }

    // Start polling every 33ms (~30 FPS)
    pollIntervalRef.current = window.setInterval(pollForFrames, 33)
    pollForFrames() // Initial poll

    return () => {
      cancelled = true
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [active, onStreamReady, hasCamera])

  return (
    <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1">
      <CardContent className="flex items-center justify-center h-full p-0 relative">
        {!hasCamera && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl z-10">
            <p className="text-foreground">Waiting for camera device... Open /camera on another device</p>
          </div>
        )}
        <video
          ref={videoRef}
          id="camera"
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover rounded-2xl bg-black"
        />
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
