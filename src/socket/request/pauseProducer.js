const Room = require('./../../room');

/**
 * Handles socket pauseProducer request
 * @method
 * @async
 * @param {Object} data object
 * @param {String} object.userId - User ID
 * @param {String} object.roomId - Room ID
 * @param {String} object.producerId - Producer ID
 */
module.exports = async ({ userId, roomId, producerId }) => {
  const action = 'pauseProducer';

  try {
    const room = Room.getRoomById(roomId);
    await room.pauseProducer({ userId, producerId });

    return { action };
  } catch (error) {
    console.error('failed to handle pause producer request', error);
    return { action, error: error.message };
  }
};
