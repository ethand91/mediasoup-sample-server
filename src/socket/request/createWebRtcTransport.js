const Room = require('./../../room');

/**
 * Handles socket createWebRtcTransport request
 * @method
 * @async
 * @param {Object} data object
 * @param {String} object.userId - User ID
 * @param {String} object.roomId - Room ID
 * @param {String} object.direction - Direction(send/recv)
 */
module.exports = async ({ userId, roomId, direction }) => {
  const action = 'createWebRtcTransport';

  try {
    const room = Room.getRoomById(roomId);
    await room.createWebRtcTransport({ userId, direction });
    
    return { action };
  } catch (error) {
    return { action, error: error.message };
  }
};
