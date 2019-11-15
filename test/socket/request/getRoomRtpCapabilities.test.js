const { stub } = require('sinon'); 

const Room = require('./../../../src/room'); 
const { handleGetRoomRtpCapabilitiesRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handleGetRoomRtpCapabilitiesRequest', () => {
  let getRoomStub;

  beforeAll(() => stub(Room.Room, 'create').callsFake(() => RoomObject));
  beforeAll(() => getRoomStub = stub(Room, 'getRoomById'));
  afterAll(() => getRoomStub.restore());

  it('should return room rtp capabilities', async () => {
    getRoomStub.callsFake(() => RoomObject);

    const response = await handleGetRoomRtpCapabilitiesRequest({}, { roomId: 'room' });
    console.log('res', response);
    expect(response.roomRtpCapabilities).toBeInstanceOf(Object);
    expect(response.action).toEqual('getRoomRtpCapabilities');
  });

  it('should create a room and return rtp capabilities', async () => {
    getRoomStub.callsFake(() => {
      throw new Error('Room was not found');
    });

    const response = await handleGetRoomRtpCapabilitiesRequest({}, { roomId: 'room' });
    expect(response.action).toEqual('getRoomRtpCapabilities');
    expect(response.roomRtpCapabilities).not.toBeUndefined();
  });
});
