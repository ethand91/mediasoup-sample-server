const Room = require('./../../room');

/**
 * Handles socket getRoomRtpCapabilities request
 * @method
 * @param {Object} data object
 * @param {String} object.roomId - Room ID
 */
module.exports = ({ roomId }) => {
  const action = 'getRoomRtpCapabilities';

  try {
    const room = Room.getRoomById(roomId);

    return { action, roomRtpCapabilities: room.routerRtpCapabilities };
  } catch (error) {
    return { action, error: error.message };
  }
};
