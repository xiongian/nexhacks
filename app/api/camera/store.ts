// Shared in-memory store for video frames
// In production, replace this with Redis or similar persistent store
const frameStore = new Map<string, { imageData: string; timestamp: number }>();

export function setFrame(cameraId: string, imageData: string, timestamp: number) {
  frameStore.set(cameraId, { imageData, timestamp });
  
  // Clean up old frames (older than 5 seconds)
  const now = Date.now();
  for (const [key, value] of frameStore.entries()) {
    if (now - value.timestamp > 5000) {
      frameStore.delete(key);
    }
  }
}

export function getFrame(cameraId: string): { imageData: string; timestamp: number } | null {
  return frameStore.get(cameraId) || null;
}
