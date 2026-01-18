import { NextRequest, NextResponse } from 'next/server';

// In-memory store for video frames
const frameStore = new Map<string, { imageData: string; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cameraId = searchParams.get('cameraId') || 'default';

    const frame = frameStore.get(cameraId);

    if (!frame) {
      return NextResponse.json({ frame: null }, { status: 200 });
    }

    return NextResponse.json({
      frame: {
        imageData: frame.imageData,
        timestamp: frame.timestamp,
      },
    });
  } catch (error) {
    console.error('Error getting frame:', error);
    return NextResponse.json({ error: 'Failed to get frame' }, { status: 500 });
  }
}

// Also handle POST for frame storage (shared store)
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
    console.error('Error storing frame:', error);
    return NextResponse.json({ error: 'Failed to store frame' }, { status: 500 });
  }
}
