const { stub } = require('sinon'); 

const Room = require('./../../../src/room');
const { handleConnectWebRtcTransportRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handleConnectWebRtcTransportRequest()', () => {
  let roomStub;

  beforeAll(() => roomStub = stub(Room, 'getRoomById'));
  afterAll(() => roomStub.restore());

  it('should return only the action if request succeeded', async () => {
    roomStub.callsFake(() => RoomObject);

    const res = await handleConnectWebRtcTransportRequest({
      userId: 'user',
      roomId: 'room',
      transportId: 'transport',
      dtlsParameters: {}
    });

    expect(res.action).toEqual('connectWebRtcTransport');
    expect(res.error).toBeUndefined();
  });

  it('should return an error if the request failed', async () => {
    roomStub.callsFake(() => {
      throw new Error('Room was not found');
    });

    const res = await handleConnectWebRtcTransportRequest({
      userId: 'user',
      roomId: 'room',
      transportId: 'transport',
      dtlsParameters: {}
    });

    expect(res.action).toEqual('connectWebRtcTransport');
    expect(res.error).toEqual('Room was not found');
  });
});
