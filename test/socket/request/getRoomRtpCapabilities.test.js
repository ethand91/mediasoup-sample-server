const { stub } = require('sinon'); 

const Room = require('./../../../src/room'); 
const { handleGetRoomRtpCapabilitiesRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handleGetRoomRtpCapabilitiesRequest', () => {
  let getRoomStub;

  beforeAll(() => getRoomStub = stub(Room, 'getRoomById'));
  afterAll(() => getRoomStub.restore());

  it('should return room rtp capabilities', () => {
    getRoomStub.callsFake(() => RoomObject);

    const response = handleGetRoomRtpCapabilitiesRequest({ roomId: 'room' });
    expect(response.roomRtpCapabilities).toBeInstanceOf(Object);
    expect(response.action).toEqual('getRoomRtpCapabilities');
  });

  it('should return error message on error', () => {
    getRoomStub.callsFake(() => {
      throw new Error('Room was not found');
    });

    const response = handleGetRoomRtpCapabilitiesRequest({ roomId: 'room' });
    expect(response.roomRtpCapabilities).toBeUndefined;
    expect(response.action).toEqual('getRoomRtpCapabilities');
    expect(response.error).toEqual('Room was not found');
  });
});
