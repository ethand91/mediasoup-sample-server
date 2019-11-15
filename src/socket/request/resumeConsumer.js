const Room = require('./../../room');

/**
 * Handles socket resumeConsumer request
 * @method
 * @async
 * @param {Object} data object
 * @param {String} object.userId - User ID
 * @param {String} object.roomId - Room ID
 * @param {String} object.consumerId - Consumer ID
 */
module.exports = async({ userId, roomId, consumerId }) => {
  const action = 'resumeConsumer';

  try {
    const room = Room.getRoomById(roomId);
    await room.resumeConsumer({ userId, consumerId });

    return { action };
  } catch (error) {
    console.error('failed to handle resumse consumer request', error);
    return { action, error: error.message };
  }
};
