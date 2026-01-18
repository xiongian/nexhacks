import { RealtimeVision } from '@overshoot/sdk';

const videoEl = document.getElementById('video') as HTMLVideoElement;
const output = document.getElementById('output') as HTMLPreElement;

async function loadVideoFile(): Promise<File> {
  const res = await fetch('/footage/vid_2.mp4');
  const blob = await res.blob();
  return new File([blob], 'vid_2.mp4', { type: 'video/mp4' });
}

async function run() {
  // Play video in the page
  videoEl.src = '/footage/vid_2.mp4';
  videoEl.muted = true;
  videoEl.playsInline = true;
  await videoEl.play();

  // Load video file for Overshoot
  const videoFile = await loadVideoFile();

  const vision = new RealtimeVision({
    apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
    apiKey: 'ovs_8ecb8c7d11ea73ef6b99395c4c48fc9f',
    prompt: 'Determine the safety of the scene shown in the video. Is it safe? If not, what are the risks?',
    source: { type: 'video', file: videoFile },
    onResult: (res) => {
      console.log('Final Overshoot output:', res.result);
      output.textContent = JSON.stringify(res.result, null, 2);
    }
  });

  await vision.start();
}

run();
