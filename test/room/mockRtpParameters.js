module.exports = {
  mid: 'video',
  codecs: [
    {
      mimeType: 'video/VP8',
      payloadType: 101,
      clockRate: 90000,
      rtcpFeedback: [
        { type: 'nack' },
        { type: 'nack', parameter: 'pli' },
        { type: 'goog-remb' }
      ]
    },
    {
      mimeType: 'video/rtx',
      payloadType: 102,
      clockRate: 90000,
      parameters: { apt: 101 }
    }
  ],
  headerExtensions: [
    {
      uri: 'urn:3gpp:video-orientation',
      id: 13
    }
  ],
  encodings: [
    { ssrc: 22222222, rtx: { ssrc: 22222223 } }
  ],
  rtcp: {
    cname: 'video-1'
  }
};
