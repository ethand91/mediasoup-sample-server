const {
  addRoom,
  getRoomById,
  Room
} = require('./room');
const Request = require('./socket/request');

let counter = 0;

module.exports.handleSocket = async(socket) => {
  socket.id = ++counter;
  console.log('io::connection [id:%s]', socket.id);

  socket.on('disconnect', () => {
    console.log('socket disconnected');
  });

  // Send all messages as JSON string
  socket.sendJson = message => socket.send(JSON.stringify(message))

  setSocketListeners(socket);
};

const setSocketListeners = socket => {
  socket.on('close', (code, reason) => {
    console.log('socket::close [id:%s, code:%d, reason:%s]', socket.id, code, reason);
    if (socket.room) {
      console.log('logging socket out of room [room.id:%s, socket.id:%s]', socket.room.id, socket.id);
      socket.room.logout(socket.id);
    }
  });

  socket.on('error', error => {
    console.error('socket::error [id:%s, error:%o]', socket.id, error);
  });

  socket.on('message', async message => {
    try {
      const json = JSON.parse(message);
      const response = await handleSocketMessage(socket, json);

      if (response) {
        console.log('send response', response);
        socket.sendJson(response);
      }
    } catch (error) {
      console.error('socket::message failed to parse message [message:%o, error:%o]', message, error);
    }
  });
};

const handleSocketMessage = (socket, json) => {
  const { action } = json;

  switch(action) {
      //json.roomId = Room ID
    case 'getRoomRtpCapabilities':
      return Request.handleGetRoomRtpCapabilitiesRequest(socket, json);
    // json.roomId = Room ID
    // json.rtpCapabilities = User RTPCapabilities
    case 'loginRoom':
      return Request.handleLoginRoomRequest(socket, { ...json, userId: socket.id });
    // json.roomId = Room ID
    // json.direction = Transport Direction(send/recv)
    case 'createWebRtcTransport':
      return Request.handleCreateWebRtcTransportRequest({ ...json, userId: socket.id });
      // json.roomId = Room Id
      // json.transportId = Transport Id
      // json.dtlsParameters
    case 'connectWebRtcTransport':
      return Request.handleConnectWebRtcTransportRequest({ ...json, userId: socket.id });
    case 'produce':
      // json.roomId = Room Id
      // json.transportId = Transport Id
      // json.kind = Produce Kind
      // json.rtpParameters RTPParameters
      return Request.handleProduceRequest({ ...json, userId: socket.id });
    case 'closeProducer':
      break;
    case 'pauseProducer':
      return Request.handlePauseProducerRequest({ ...json, userId: socket.id });
    case 'resumeProducer':
      return Request.handleResumeProducerRequest({ ...json, userId: socket.id });
    case 'pauseConsumer':
      return Request.handlePauseConsumerRequest({ ...json, userId: socket.id });
    case 'resumeConsumer':
      return Request.handleResumeConsumerRequest({ ...json, userId: socket.id });
      break;
    case 'getTransportStats':
      break;
    case 'getProducerStats':
      break;
    case 'getConsumerStats':
      break;
    case 'rtcStats':
      return Request.handleRemoteRtcStatsReport({ ...json, userId: socket.id });
    default: throw new Error(`Unknown action ${action}`);  
  }
};
