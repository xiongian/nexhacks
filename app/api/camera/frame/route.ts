import { NextRequest, NextResponse } from 'next/server';
import { getFrame, setFrame } from '../store';

export async function GET(request: NextRequest) {
  console.log('\n[CAMERA FRAME API] ========== GET /api/camera/frame ==========');
  console.log(`[CAMERA FRAME API] Request URL: ${request.url}`);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const cameraId = searchParams.get('cameraId') || 'default';
    console.log(`[CAMERA FRAME API] Requested cameraId: ${cameraId}`);

    const frame = getFrame(cameraId);

    if (!frame) {
      console.log('[CAMERA FRAME API] No frame available, returning null');
      return NextResponse.json({ frame: null }, { status: 200 });
    }

    console.log(`[CAMERA FRAME API] Returning frame - timestamp: ${frame.timestamp}, data length: ${frame.imageData?.length || 0}`);
    return NextResponse.json({
      frame: {
        imageData: frame.imageData,
        timestamp: frame.timestamp,
      },
    });
  } catch (error) {
    console.error('[CAMERA FRAME API] ERROR getting frame:', error);
    return NextResponse.json({ error: 'Failed to get frame' }, { status: 500 });
  }
}

// Also handle POST for frame storage (shared store)
export async function POST(request: NextRequest) {
  console.log('\n[CAMERA FRAME API] ========== POST /api/camera/frame ==========');
  
  try {
    const body = await request.json();
    const { imageData, timestamp, cameraId } = body;
    
    console.log(`[CAMERA FRAME API] Received POST request`);
    console.log(`[CAMERA FRAME API] cameraId: ${cameraId || 'default'}`);
    console.log(`[CAMERA FRAME API] imageData present: ${!!imageData}`);
    console.log(`[CAMERA FRAME API] imageData length: ${imageData?.length || 0} chars`);
    console.log(`[CAMERA FRAME API] timestamp: ${timestamp || 'not provided (will use Date.now())'}`);

    if (!imageData) {
      console.log('[CAMERA FRAME API] ERROR: No image data provided');
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const id = cameraId || 'default';
    const ts = timestamp || Date.now();
    console.log(`[CAMERA FRAME API] Storing frame with id: ${id}, timestamp: ${ts}`);
    setFrame(id, imageData, ts);

    console.log('[CAMERA FRAME API] Frame stored successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CAMERA FRAME API] ERROR storing frame:', error);
    return NextResponse.json({ error: 'Failed to store frame' }, { status: 500 });
  }
}
