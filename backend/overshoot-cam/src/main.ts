import { RealtimeVision } from '@overshoot/sdk';

const video = document.getElementById('camera') as HTMLVideoElement;
const output = document.getElementById('output') as HTMLDivElement;

const vision = new RealtimeVision({
  apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
  apiKey: 'ovs_8ecb8c7d11ea73ef6b99395c4c48fc9f',  // <-- replace with your key
  prompt: 'Describe the danger on a scale of 1 to 10. Increase score if sudden movements.',

  onResult: (result) => {
    output.textContent = result.result || "No text detected";
    console.log('Overshoot result:', result.result);
  }
});

async function startVision() {
  try {
    await vision.start();
    console.log('Camera & vision started');
  } catch (err) {
    console.error('Error starting vision:', err);
  }
}

async function stopVision() {
  await vision.stop();
  console.log('Camera stopped');
}

startVision();
