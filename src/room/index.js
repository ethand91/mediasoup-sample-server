const { Room } = require('./room');
const {
  addRoom,
  getRoomById,
  removeRoomById
} = require('./roomMap');

module.exports = {
  Room,
  addRoom,
  getRoomById,
  removeRoomById
};
