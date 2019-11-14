const DEFAULT_CONSTRAINTS = Object.freeze({
  audio: true,
  video: { width: 640, height: 480 }
});

module.exports.GUM = async (mediaConstraints = DEFAULT_CONSTRAINTS) =>
  await navigator.mediaDevices.getUserMedia(mediaConstraints);
