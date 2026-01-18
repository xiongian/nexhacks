import { NextRequest, NextResponse } from 'next/server';
import { setFrame } from '../store';

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
    console.error('Error uploading frame:', error);
    return NextResponse.json({ error: 'Failed to upload frame' }, { status: 500 });
  }
}
