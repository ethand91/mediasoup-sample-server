const Room = require('./../../room');

/**
 * Handles socket produce request
 * @method
 * @async
 * @param {Object} data object
 * @param {String} object.roomId - Room ID
 * @param {String} object.userId - User ID
 * @param {String} object.transportId - Transport ID
 * @param {String} object.kind - Produce Kind (video/audio)
 * @param {Object} object.rtpParameters - Producer RTPParameters
 */
module.exports = async ({ roomId, userId, transportId, kind, rtpParameters }) => {
  const action = 'produce';

  try {
    const room = Room.getRoomById(roomId);
    const { id } = await room.createProducer({ userId, transportId, kind, rtpParameters });

    return { action, producerId: id }; 
  } catch (error) {
    return { action, error: error.message };
  }
};
