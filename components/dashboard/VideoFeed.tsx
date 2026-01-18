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
  const streamCreatedRef = useRef<boolean>(false)
  const canvasInitializedRef = useRef<boolean>(false)
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
      canvasInitializedRef.current = false
      streamCreatedRef.current = false
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

            // Create new image for each frame
            const img = new Image()
            img.crossOrigin = "anonymous"
            
            // Set up load handler - this runs when image loads
            img.onload = () => {
              if (cancelled) return

              // Initialize canvas dimensions only once on first frame
              if (!canvasInitializedRef.current) {
                const targetWidth = img.width || 1280
                const targetHeight = img.height || 720
                canvas.width = targetWidth
                canvas.height = targetHeight
                canvasInitializedRef.current = true
                
                // Ensure canvas is visible and has proper styling
                canvas.style.display = 'block'
                canvas.style.width = '100%'
                canvas.style.height = '100%'
                canvas.style.objectFit = 'cover'
              }
              
              // CRITICAL: Draw the image to canvas on EVERY frame
              // This must happen for every frame that loads, not just the first one
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
              
              // Create a MediaStream from canvas for Overshoot SDK (only once, after first draw)
              if (!streamCreatedRef.current && canvas.captureStream && video && canvas.width > 0 && canvas.height > 0) {
                try {
                  const stream = canvas.captureStream(30) // 30 FPS
                  streamRef.current = stream
                  streamCreatedRef.current = true
                  
                  // Set the stream on video element for SDK
                  video.srcObject = stream
                  
                  // Try playing video (for SDK, even though it's hidden)
                  video.play().catch((err) => {
                    if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                      console.error("Error playing video for SDK:", err)
                    }
                  })
                  
                  // Notify parent that stream is ready - this starts the Overshoot SDK
                  onStreamReady?.(stream)
                } catch (err) {
                  console.error("Error creating canvas stream for SDK:", err)
                }
              }
            }
            
            img.onerror = (err) => {
              console.error("Error loading image frame:", err)
            }
            
            // Load the image - this triggers onload when ready
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
  }, [active, onStreamReady])

  return (
    <Card className="h-full min-h-[60vh] sm:min-h-[60vh] flex-1">
      <CardContent className="flex items-center justify-center h-full p-0 relative">
        {!hasCamera && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl z-10">
            <p className="text-white text-xl font-extrabold">Camera Disabled, Video Feed Paused</p>
          </div>
        )}
        <video
          ref={videoRef}
          id="camera"
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover rounded-2xl bg-black"
          style={{ 
            backgroundColor: '#000',
            display: 'none' // Hidden - only used by Overshoot SDK
          }}
        />
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover rounded-2xl bg-black"
          style={{ 
            display: 'block',
            width: '100%',
            height: '100%',
            backgroundColor: '#000'
          }}
        />
      </CardContent>
    </Card>
  )
}
