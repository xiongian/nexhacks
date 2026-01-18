"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { RealtimeVision } from '@overshoot/sdk'

interface VisionResult {
  text: string
  dangerLevel: number
  timestamp: Date
}

interface UseOvershootVisionReturn {
  isActive: boolean
  currentResult: VisionResult | null
  error: string | null
  startVision: () => Promise<void>
  stopVision: () => Promise<void>
  videoRef: React.RefObject<HTMLVideoElement>
}

export function useOvershootVision(): UseOvershootVisionReturn {
  const [isActive, setIsActive] = useState(false)
  const [currentResult, setCurrentResult] = useState<VisionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const visionRef = useRef<RealtimeVision | null>(null)

  const extractDangerLevel = useCallback((text: string): number => {
    // Extract danger level from text (assuming format like "Danger level: 7/10" or similar)
    const levelMatch = text.match(/(\d+)\/10/i) || text.match(/level\s*(\d+)/i)
    if (levelMatch) {
      const level = parseInt(levelMatch[1])
      return Math.min(Math.max(level, 1), 10) // Clamp between 1-10
    }

    // Fallback: analyze keywords for danger level
    const dangerKeywords = ['danger', 'threat', 'emergency', 'critical', 'warning']
    const movementKeywords = ['sudden', 'fast', 'rapid', 'quick']

    let score = 1
    const lowerText = text.toLowerCase()

    dangerKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 2
    })

    movementKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 1
    })

    return Math.min(score, 10)
  }, [])

  const startVision = useCallback(async () => {
    if (!videoRef.current) {
      setError('Video element not available')
      return
    }

    try {
      setError(null)

      // Get camera access first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      })

      // Set the video element source to the camera stream
      videoRef.current.srcObject = stream
      videoRef.current.muted = true

      // Wait for the video to be ready
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve(void 0)
        }
      })

      // Initialize vision with the same configuration as the backend
      const vision = new RealtimeVision({
        apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
        apiKey: 'ovs_8ecb8c7d11ea73ef6b99395c4c48fc9f',
        prompt: 'Describe the danger on a scale of 1 to 10. Increase score if sudden movements.',

        onResult: (result) => {
          const text = result.result || "No text detected"
          const dangerLevel = extractDangerLevel(text)

          const visionResult: VisionResult = {
            text,
            dangerLevel,
            timestamp: new Date()
          }

          setCurrentResult(visionResult)
          console.log('Overshoot result:', visionResult)
        }
      })

      visionRef.current = vision
      await vision.start()
      setIsActive(true)
      console.log('Camera & vision started')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error starting vision'
      setError(errorMessage)
      console.error('Error starting vision:', err)
    }
  }, [extractDangerLevel])

  const stopVision = useCallback(async () => {
    if (visionRef.current) {
      try {
        await visionRef.current.stop()
        console.log('Vision analysis stopped')
      } catch (err) {
        console.error('Error stopping vision:', err)
      }
    }

    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsActive(false)
    console.log('Camera stopped')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (visionRef.current) {
        visionRef.current.stop().catch(console.error)
      }
    }
  }, [])

  return {
    isActive,
    currentResult,
    error,
    startVision,
    stopVision,
    videoRef
  }
}