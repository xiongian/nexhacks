const vision = new RealtimeVision({
  apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
  apiKey: 'your-api-key',
  prompt: 'Describe what you see',
  source: { type: 'video', file: videoFile },
  onResult: (result) => {
    console.log(result.result)
  }
})