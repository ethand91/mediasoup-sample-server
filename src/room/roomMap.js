const rooms = new Map();

/**
 * Add a room the room map
 * @method
 * @param {Object} room object
 * @throws Error - room already exists
 */
module.exports.addRoom = (room) => {
  if (rooms.has(room.id)) {
    throw new Error(`Room with id ${room.id} already exists`);
  }

  rooms.set(room.id, room);
};

/**
 * Gets a room from the map via roomId
 * @method
 * @param {String} roomId - Room ID
 * @throws Error - room was not found
 */
module.exports.getRoomById = (roomId) => {
  const room = rooms.get(roomId);

  if (!room) {
    throw new Error(`Room with id ${roomId} was not found`);
  }

  return room;
};

/**
 * Removes a room from the map via roomId
 * @method
 * @param {String} roomId - Room ID
 * @throws Error - room was not found
 */
module.exports.removeRoomById = (roomId) => {
  if (!rooms.has(roomId)) {
    throw new Error(`Room with id ${roomId} was not found`);
  }

  rooms.delete(roomId);
};

/**
 * @returns room map size
 */
module.exports.size = () => rooms.size;
/**
 * Clears the room map
 */
module.exports.clear = () => rooms.clear();
