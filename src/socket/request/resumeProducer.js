const Room = require('./../../room');

/**
 * Handles socket resumeProducer request
 * @method
 * @async
 * @param {Object} data object
 * @param {String} object.userId - User ID
 * @param {String} object.roomId - Room ID
 * @param {String} object.producerId - Producer ID
 */
module.exports = async ({ userId, roomId, producerId }) => {
  const action = 'resumeProducer';

  try {
    const room = Room.getRoomById(roomId);
    await room.resumeProducer({ userId, producerId });

    return { action };
  } catch (error) {
    console.error('failed to handle resumse producer request', error);
    return { action, error: error.message };
  }
};
