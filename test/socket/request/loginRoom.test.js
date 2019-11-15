const { stub } = require('sinon');

const Room = require('./../../../src/room');
const { handleLoginRoomRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handleLoginRoomRequest()', () => {
  const socketMock = {};
  let roomStub;

  beforeAll(() => roomStub = stub(Room, 'getRoomById'));
  afterAll(() => roomStub.release());

  it('should set the socket.room and return just the action if the request succeeded', () => {
    roomStub.callsFake(() => RoomObject);

    const res = handleLoginRoomRequest(socketMock, { userId: 'user', roomId: 'room', rtpCapabilities: {} });
    expect(res.action).toEqual('loginRoom');
    expect(res.error).toBeUndefined;
    expect(socketMock.room).toEqual(RoomObject);
  });

  it('should return an error if the reqeust failed', () => {
    roomStub.callsFake(() => {
      throw new Error('Room was not found');
    });

    const res = handleLoginRoomRequest(socketMock, { userId: 'user', roomId: 'room', rtpCapabilities: {} });
    expect(res.action).toEqual('loginRoom');
    expect(res.error).toEqual('Room was not found');
    expect(socketMock.room).toBeUndefined;
  });
});
