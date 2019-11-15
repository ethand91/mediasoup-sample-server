const handleGetRoomRtpCapabilitiesRequest = require('./getRoomRtpCapabilities');
const handleLoginRoomRequest = require('./loginRoom');
const handleCreateWebRtcTransportRequest = require('./createWebRtcTransport');
const handleConnectWebRtcTransportRequest = require('./connectWebRtcTransport');
const handleProduceRequest = require('./produce');
const handlePauseConsumerRequest = require('./pauseConsumer');
const handleResumeConsumerRequest = require('./resumeConsumer');
const handlePauseProducerRequest = require('./pauseProducer');
const handleResumeProducerRequest = require('./resumeProducer');

module.exports = {
  handleGetRoomRtpCapabilitiesRequest,
  handleLoginRoomRequest,
  handleCreateWebRtcTransportRequest,
  handleConnectWebRtcTransportRequest,
  handleProduceRequest,
  handlePauseConsumerRequest,
  handleResumeConsumerRequest,
  handlePauseProducerRequest,
  handleResumeProducerRequest
};
