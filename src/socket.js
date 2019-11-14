const uuidv4 = require('uuid/v4');

const { Room } = require('./room');

const rooms = new Map();
let counter = 0;

module.exports.handleSocket = async(socket) => {
  //socket.id = uuidv4();
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
      socket.room.logout(socket.id);
    }
  });

  socket.on('error', error => {
    console.error('socket::error [id:%s, error:%o]', socket.id, error);
  });

  socket.on('message', async message => {
    console.log('socket::message [id:%s, message:%o]', socket.id, message);

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
      return handleGetRoomRtpCapabilitiesRequest(socket, json);
    // json.roomId = Room ID
    // json.rtpCapabilities = User RTPCapabilities
    case 'loginRoom':
      return handleLoginRoomRequest(socket, json);
    // json.roomId = Room ID
    // json.direction = Transport Direction(send/recv)
    case 'createWebRtcTransport':
      return handleCreateWebRtcTransportRequest(socket, json);
      // json.roomId = Room Id
      // json.transportId = Transport Id
      // json.dtlsParameters
    case 'connectWebRtcTransport':
      return handleConnectWebRtcTransportRequest(socket, json);
    case 'produce':
      // json.roomId = Room Id
      // json.transportId = Transport Id
      // json.kind = Produce Kind
      // json.rtpParameters RTPParameters
      return handleProduceRequest(socket, json);
      break;
    case 'closeProducer':
      break;
    case 'pauseProducer':
      break;
    case 'resumeProducer':
      break;
    case 'pauseConsumer':
      break;
    case 'resumeConsumer':
      return handleResumeConsumerRequest(socket, json);
      break;
    case 'getTransportStats':
      break;
    case 'getProducerStats':
      break;
    case 'getConsumerStats':
      break;
    default: throw new Error(`Unknown action ${action}`);  
  }
};

const handleGetRoomRtpCapabilitiesRequest = async (socket, { roomId }) => {
  console.log('handleGetRoomRtpCapabilitiesRequest [id:%s, roomId:%s]', socket.id, roomId);
  const room = await getOrCreateRoom(socket, { roomId }); 

  return {
    action: 'getRoomRtpCapabilities',
    roomRtpCapabilities: room.routerRtpCapabilities
  };
};

const handleLoginRoomRequest = async (socket, { roomId, rtpCapabilities }) => {
  const room = getRoomById(roomId);
  socket.room = room;
  room.login({ userId: socket.id, rtpCapabilities });

  return {
    action: 'loginRoom',
    status: 'success'
  };
};

const handleCreateWebRtcTransportRequest = async (socket, { roomId, direction }) => {
  const room = getRoomById(roomId);

  const webRtcTransportData = await room.createWebRtcTransport({ userId: socket.id, direction });
  return {
    action: 'createWebRtcTransport',
    webRtcTransportData
  };
};

const handleConnectWebRtcTransportRequest = async (socket, { roomId, transportId, dtlsParameters }) => {
  try {
    const room = getRoomById(roomId);
    await room.connectWebRtcTransport({ userId: socket.id, transportId, dtlsParameters });

    return {
      action: 'connectWebRtcTransport',
      status: 'success'
    };
  } catch (error) {
    console.error('CONNECT ERROR', error);
    return {
      action: 'connectWebRtcTransport',
      status: 'error'
    };
  }
};

const handleProduceRequest = async (socket, { roomId, transportId, kind, rtpParameters}) => {
  const room = getRoomById(roomId);
  const producerData = await room.createProducer({
    userId: socket.id, transportId, kind, rtpParameters
  });

  console.log('handleProducerRequest() return [id:%s]', producerData.id);

  return {
    action: 'produce',
    producerId: producerData.id
  };
};

const handleResumeConsumerRequest = async (socket, { userId, roomId, consumerId }) => {
  const room = getRoomById(roomId);
  await room.resumeConsumer({ userId, consumerId });

  return {
    action: 'resumeConsumer',
    status: 'success'
  };
};

const getOrCreateRoom = async (socket, { roomId }) => {
  let room = rooms.get(roomId);

  // Room doesn't exist so create it
  if (!room) {
    room = await Room.create({ roomId });
    setRoomListeners(socket, room);
    rooms.set(roomId, room);
  }

  return room;
};

const getRoomById = (roomId) => {
  const room = rooms.get(roomId);

  if (!room) {
    throw new Error(`Room with id ${roomId} was not found`);
  }

  return room;
};

const setRoomListeners = (socket, room) => {
  room.on('newuser', userId => {
    socket.broadcast({
      action: 'newuser',
      userId
    });
  });

  room.on('consumerclose', (userId, consumerId) => {
    socket.broadcase({
      action: 'consumerclose',
      userId,
      consumerId
    });
  });

  room.on('producerpause', (userId, consumerId) => {
    socket.broadcast({
      action: 'producerpause',
      userId,
      consumerId
    });
  });

  room.on('producerresume', (userId, consumerId) => {
    socket.broadcast({
      action: 'producerresume',
      userId,
      consumerId
    });
  });

  room.on('score', (userId, consumerId) => {
    socket.broadcast({
      action: 'score',
      userId,
      consumerId
    });
  });

  room.on('newconsumer', consumerData => {
    socket.broadcast({
      action: 'newconsumer',
      consumerData
    });
  });

  room.on('close', () => {
    socket.broadcast({
      action: 'close'
    });
  });
};
