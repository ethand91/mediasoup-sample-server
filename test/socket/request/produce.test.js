const { stub } = require('sinon');

const Room = require('./../../../src/room');
const { handleProduceRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handleProduceRequest()', () => {
  let roomStub;

  beforeAll(() => roomStub = stub(Room, 'getRoomById'));
  afterAll(() => roomStub.restore());

  it('should return producerId if request was successful', async () => {
    roomStub.callsFake(() => RoomObject);
    const res = await handleProduceRequest({
      roomId: 'room',
      userId: 'user',
      transportId: 'transport',
      kind: 'video',
      rtpParameters: {}
    });

    expect(res.action).toEqual('produce');
    expect(res.error).toBeUndefined();
    expect(res.producerId).toEqual('producer');
  });

  it('should return an error if request failed', async () => {
    roomStub.callsFake(() => {
      throw new Error('Room was not found');
    });

    const res = await handleProduceRequest({
      roomId: 'room',
      userId: 'user',
      transportId: 'transport',
      kind: 'video',
      rtpParameters: {}
    });

    expect(res.action).toEqual('produce');
    expect(res.producerId).toBeUndefined();
    expect(res.error).toEqual('Room was not found');
  });
});
