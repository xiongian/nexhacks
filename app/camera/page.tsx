"use client"

import { useEffect, useRef, useState } from "react"

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameIntervalRef = useRef<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [status, setStatus] = useState("Ready to stream")

  const startStreaming = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera not available")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Setup canvas for frame capture
      const canvas = canvasRef.current
      if (!canvas) return

      const video = videoRef.current
      if (!video) return

      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      setIsStreaming(true)
      setStatus("Streaming...")

      // Capture and send frames via API
      const sendFrame = async () => {
        if (!video.videoWidth || !video.videoHeight) {
          frameIntervalRef.current = requestAnimationFrame(sendFrame)
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = canvas.toDataURL("image/jpeg", 0.7)

        try {
          await fetch("/api/camera/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageData,
              timestamp: Date.now(),
              cameraId: "default",
            }),
          })
        } catch (error) {
          console.error("Error sending frame:", error)
        }

        frameIntervalRef.current = requestAnimationFrame(sendFrame)
      }

      sendFrame()
    } catch (error) {
      console.error("Error accessing camera:", error)
      setStatus("Error accessing camera")
    }
  }

  const stopStreaming = () => {
    if (frameIntervalRef.current !== null) {
      cancelAnimationFrame(frameIntervalRef.current)
      frameIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setStatus("Stopped")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current !== null) {
        cancelAnimationFrame(frameIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-light text-foreground mb-6 text-center">
          Camera Device
        </h1>

        <div className="mb-4 text-center">
          <p className="text-muted-foreground">Status: {status}</p>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex justify-center gap-4 mt-6">
          {!isStreaming ? (
            <button
              onClick={startStreaming}
              type="button"
              className="px-8 py-4 bg-danger text-foreground font-medium hover:opacity-90 transition-opacity border border-[#000000] border-[0.0625rem] rounded-lg text-lg min-w-[200px]"
              style={{ backgroundColor: '#ff7171', color: '#000000' }}
            >
              Start Streaming
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              type="button"
              className="px-8 py-4 bg-danger text-foreground font-medium hover:opacity-90 transition-opacity border border-[#000000] border-[0.0625rem] rounded-lg text-lg min-w-[200px]"
              style={{ backgroundColor: '#ff7171', color: '#000000' }}
            >
              Stop Streaming
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
