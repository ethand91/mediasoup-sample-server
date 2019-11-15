module.exports = {
  connectWebRtcTransport: () => Promise.resolve(),
  createWebRtcTransport: () => Promise.resolve(),
  pauseConsumer: () => Promise.resolve(),
  resumeConsumer: () => Promise.resolve(),
  pauseProducer: () => Promise.resolve(),
  resumeProducer: () => Promise.resolve(),
  createProducer: () => Promise.resolve({ id: 'producer' }),
  login: () => {},
  routerRtpCapabilities: {
    codecs: [
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
      },
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
      }
    ],
    headerExtensions: [
      {
        kind: 'video',
        uri: 'uri::header::extension',
        preferredId: 1
      }
    ]
  }
};
