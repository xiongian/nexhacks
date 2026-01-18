import { RealtimeVision } from '@overshoot/sdk';

const videoEl = document.getElementById('video') as HTMLVideoElement;
const output = document.getElementById('output') as HTMLPreElement;

async function loadVideoFile(): Promise<File> {
  const response = await fetch('/footage/vid_1.mp4');
  if (!response.ok) {
    throw new Error('Failed to load video file');
  }

  const blob = await response.blob();

  return new File([blob], 'vid_4.mp4', {
    type: 'video/mp4'
  });
}

async function run() {
  // added
  videoEl.src = '/footage/vid_4.mp4';
  videoEl.muted = true;          // allow autoplay
  videoEl.playsInline = true;
  await videoEl.play();


  const videoFile = await loadVideoFile();

  const vision = new RealtimeVision({
    apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
    apiKey: 'ovs_8ecb8c7d11ea73ef6b99395c4c48fc9f',
    prompt: 'Map the scene to a 10 by 10 two dimensional grid and output sets of points representing the coordinates of each person walking',
    source: {
      type: 'video',
      file: videoFile
    },
    onResult: (result) => {
      console.log('RESULT:', result.result);
      output.textContent = JSON.stringify(result.result, null, 2);
    },
    onError: (err) => {
      console.error('ERROR:', err);
      output.textContent = String(err);
    }
  });

 await vision.start();
}

run();