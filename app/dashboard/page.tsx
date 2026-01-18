"use client"

import { useEffect, useRef, useState } from "react"
import { WarningWidget } from "@/components/dashboard/WarningWidget"
import { AISummary } from "@/components/dashboard/SituationSummary"
import { VideoFeed } from "@/components/dashboard/VideoFeed"
import { PersonLocator } from "@/components/dashboard/PersonLocator"
import { useOvershootVision } from "@/app/overshoot"

export default function DashboardPage() {
  const username = "User"
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameIntervalRef = useRef<number | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  const {
    sections,
    overallDangerLevel,
    dangerSince,
    isMonitoring,
    setIsMonitoring,
  } = useOvershootVision()

  // Handle camera streaming when monitoring starts/stops
  useEffect(() => {
    if (!isMonitoring) {
      // Stop streaming
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
      setRemoteStream(null)
      return
    }

    // Start camera streaming
    const startCameraStreaming = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error("Camera not available")
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        })

        streamRef.current = stream
        setRemoteStream(stream)

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
      }
    }

    startCameraStreaming()
  }, [isMonitoring])

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

  // Combine all section grids into one person locator grid with danger levels
  const combinedPersonGrid = Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 10 }, (_, col) => {
      // Check danger levels in order: DANGER > WARNING > SAFE
      if (
        (sections.closest?.grid?.[row]?.[col] && sections.closest.level === "DANGER") ||
        (sections.middle?.grid?.[row]?.[col] && sections.middle.level === "DANGER") ||
        (sections.farthest?.grid?.[row]?.[col] && sections.farthest.level === "DANGER")
      ) {
        return "DANGER"
      }
      if (
        (sections.closest?.grid?.[row]?.[col] && sections.closest.level === "WARNING") ||
        (sections.middle?.grid?.[row]?.[col] && sections.middle.level === "WARNING") ||
        (sections.farthest?.grid?.[row]?.[col] && sections.farthest.level === "WARNING")
      ) {
        return "WARNING"
      }
      if (
        (sections.closest?.grid?.[row]?.[col] && sections.closest.level === "SAFE") ||
        (sections.middle?.grid?.[row]?.[col] && sections.middle.level === "SAFE") ||
        (sections.farthest?.grid?.[row]?.[col] && sections.farthest.level === "SAFE")
      ) {
        return "SAFE"
      }
      return null // No person detected
    })
  )

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-light text-foreground mb-8">
          Welcome {username}.
        </h1>

        <div className="flex flex-row gap-4 sm:gap-6 mb-4 sm:mb-6 min-h-[30vh]">
          <WarningWidget level={overallDangerLevel} since={dangerSince} />
          <AISummary
            title="AI Summary of Ongoing Situation"
            sections={sections}
          />
        </div>

        <div className="flex flex-row gap-4 sm:gap-6 min-h-[60vh]">
          <div className="flex flex-col flex-1 gap-3">
            <div className="relative rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-auto hidden"
              />
              <canvas ref={canvasRef} className="hidden" />
              <VideoFeed
                active={isMonitoring}
                onStreamReady={setRemoteStream}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsMonitoring((value) => !value)}
              className="self-start px-4 py-2 text-xs sm:text-sm bg-danger text-foreground border border-[#000000] border-[0.0625rem]"
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </button>
          </div>
          <PersonLocator grid={combinedPersonGrid} />
        </div>
      </div>
    </div>
  )
}