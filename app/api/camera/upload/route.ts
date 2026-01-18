import { NextRequest, NextResponse } from 'next/server';

// In-memory store for video frames (in production, use Redis or similar)
const frameStore = new Map<string, { imageData: string; timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, timestamp, cameraId } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const id = cameraId || 'default';
    frameStore.set(id, { imageData, timestamp: timestamp || Date.now() });

    // Clean up old frames (older than 5 seconds)
    const now = Date.now();
    for (const [key, value] of frameStore.entries()) {
      if (now - value.timestamp > 5000) {
        frameStore.delete(key);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading frame:', error);
    return NextResponse.json({ error: 'Failed to upload frame' }, { status: 500 });
  }
}
