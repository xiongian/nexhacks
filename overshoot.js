const vision = new RealtimeVision({
  apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
  apiKey: process.env.OVERSHOOT_API_KEY,
  prompt: 'Describe what you see',
  source: { type: 'video', file: videoFile },
  onResult: (result) => {
    console.log(result.result)
  }
})