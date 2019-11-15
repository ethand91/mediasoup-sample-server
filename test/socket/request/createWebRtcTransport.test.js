const { stub } = require('sinon');

const Room = require('./../../../src/room');
const { handleCreateWebRtcTransportRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handleCreateWebRtcTransportRequest()', () => {
  let roomStub;

  beforeAll(() => roomStub = stub(Room, 'getRoomById'));
  afterAll(() => roomStub.restore());

  it('should only return action if the request succeeded', async () => {
    roomStub.callsFake(() => RoomObject);
    const res = await handleCreateWebRtcTransportRequest({
      userId: 'user',
      roomId: 'room',
      direction: 'send'
    });

    expect(res.action).toEqual('createWebRtcTransport');
    expect(res.error).toBeUndefined;
  });

  it('should return an error if the request failed', async () => {
    roomStub.callsFake(() => {
      throw new Error('Room not found');
    });

    const res = await handleCreateWebRtcTransportRequest({
      userId: 'user',
      roomId: 'room',
      direction: 'send'
    });

    expect(res.action).toEqual('createWebRtcTransport');
    expect(res.error).toEqual('Room not found');
  });
});
