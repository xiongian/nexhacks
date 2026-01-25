import { NextRequest, NextResponse } from 'next/server';
import { setFrame } from '../store';

export async function POST(request: NextRequest) {
  console.log('\n[CAMERA UPLOAD API] ========== POST /api/camera/upload ==========');
  
  try {
    const body = await request.json();
    const { imageData, timestamp, cameraId } = body;
    
    console.log(`[CAMERA UPLOAD API] Received upload request`);
    console.log(`[CAMERA UPLOAD API] cameraId: ${cameraId || 'default'}`);
    console.log(`[CAMERA UPLOAD API] imageData present: ${!!imageData}`);
    console.log(`[CAMERA UPLOAD API] imageData length: ${imageData?.length || 0} chars`);
    if (imageData) {
      console.log(`[CAMERA UPLOAD API] imageData preview: ${imageData.substring(0, 50)}...`);
    }
    console.log(`[CAMERA UPLOAD API] timestamp: ${timestamp || 'not provided (will use Date.now())'}`);

    if (!imageData) {
      console.log('[CAMERA UPLOAD API] ERROR: No image data provided');
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const id = cameraId || 'default';
    const ts = timestamp || Date.now();
    console.log(`[CAMERA UPLOAD API] Storing frame with id: ${id}, timestamp: ${ts}`);
    setFrame(id, imageData, ts);

    console.log('[CAMERA UPLOAD API] Frame uploaded and stored successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CAMERA UPLOAD API] ERROR uploading frame:', error);
    return NextResponse.json({ error: 'Failed to upload frame' }, { status: 500 });
  }
}
