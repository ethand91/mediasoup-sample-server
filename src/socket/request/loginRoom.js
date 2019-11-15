const Room = require('./../../room');

/**
 * Handles socket loginRoom request
 * @method
 * @param {Object} login room data object
 * @param {String} object.userId - User ID
 * @param {String} object.roomId - Room ID
 * @param {Object} object.rtpCapabilities - User's RTPCapabilities object
 */
module.exports = (socket, { userId, roomId, rtpCapabilities }) => {
  const action = 'loginRoom';
 
  try {
    const room = Room.getRoomById(roomId);

    socket.room = room;
    room.login({ userId, rtpCapabilities });

    return { action };
  } catch (error) {
    console.error('failed to handle login room request', error);
    return { action, error: error.message };
  }
};
