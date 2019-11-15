const Room = require('./../../room');

/**
 * Handles socket connectWebRtcTransport request
 * @method
 * @async
 * @param {Object} data object
 * @param {String} object.userId - User ID
 * @param {String} object.roomId - Room ID
 * @param {String} object.transportId - Transport ID
 * @param {Object} object.dtlsParameters - User's Transport DTLSParameters object
 */
module.exports = async ({ userId, roomId, transportId, dtlsParameters }) => {
  const action = 'connectWebRtcTransport';

  try {
    const room = Room.getRoomById(roomId);
    await room.connectWebRtcTransport({ userId, transportId, dtlsParameters });

    return { action };
  } catch (error) {
    console.error('failed to handle connectWebRtcTransportRequest', error);
    return { action, error: error.message };
  }
};
