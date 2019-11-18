const Room = require('./../../room');

/**
 * Handles socket getRoomRtpCapabilities request
 * @method
 * @async
 * @param {Object} data object
 * @param {String} object.roomId - Room ID
 */
module.exports = async (socket, { roomId }) => {
  const action = 'getRoomRtpCapabilities';
  let room;

  try {
    room = Room.getRoomById(roomId);
  } catch (error) {
    // Room is not created so create it

    room = await Room.Room.create({ roomId });
    Room.addRoom(room);
    setRoomListeners(socket, room);
  }
    
  return { action, roomRtpCapabilities: room.routerRtpCapabilities };
};

const setRoomListeners = (socket, room) => {
  room.on('newuser', userId => {
    socket.broadcast({
      action: 'newuser',
      userId
    });
  });

  room.on('consumerclose', (userId, consumerId) => {
    socket.broadcast({
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
    socket.emitToSocket(consumerData.consumerUserId, {
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
