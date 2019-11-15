const RoomMap = require('./../../src/room/roomMap');

describe('RoomMap', () => {
  afterEach(() => RoomMap.clear());
  
  describe('addRoom', () => {
    it('should add a room to the map', () => {
      RoomMap.addRoom({ id: 'room' });
      expect(RoomMap.getRoomById('room')).not.toBeUndefined();
    });

    it('should throw an error if the room already exists', () => {
      RoomMap.addRoom({ id: 'room' });

      expect(() => {
        RoomMap.addRoom({ id: 'room' });
      }).toThrowError(new Error('Room with id room already exists'));
    });
  });

  describe('getRoomById', () => {
    it('should return the reqeusted room', () => {
      RoomMap.addRoom({ id: 'room' });
      expect(RoomMap.getRoomById('room')).not.toBeUndefined();
    });

    it('should throw an error if the room was not found', () => {
      expect(() => {
        RoomMap.getRoomById('room');
      }).toThrowError(new Error('Room with id room was not found'));
    });
  });

  describe('removeRoomById', () => {
    it('should remove the room from the map', () => {
      RoomMap.addRoom({ id: 'room' });
      RoomMap.removeRoomById('room');
      expect(RoomMap.size()).toEqual(0);
    });

    it('should throw an error if the room was not found', () => {
      expect(() => {
        RoomMap.removeRoomById('null');
      }).toThrowError(new Error('Room with id null was not found'));
    });
  });
});
