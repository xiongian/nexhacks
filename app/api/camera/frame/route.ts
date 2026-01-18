import { NextRequest, NextResponse } from 'next/server';
import { getFrame, setFrame } from '../store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cameraId = searchParams.get('cameraId') || 'default';

    const frame = getFrame(cameraId);

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
    setFrame(id, imageData, timestamp || Date.now());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing frame:', error);
    return NextResponse.json({ error: 'Failed to store frame' }, { status: 500 });
  }
}
