const { stub } = require('sinon');

const Room = require('./../../../src/room');
const { handlePauseProducerRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handlePauseProducerRequest()', () => {
  let roomStub;

  beforeAll(() => roomStub = stub(Room, 'getRoomById'));
  afterAll(() => roomStub.restore());

  it('should return only the action if request succeeded', async () => {
    roomStub.callsFake(() => RoomObject);

    const res = await handlePauseProducerRequest({
      roomId: 'room',
      userId: 'user',
      producerId: 'producer'
    });

    expect(res.action).toEqual('pauseProducer');
    expect(res.error).toBeUndefined();
  });

  it('should return an error if the request failed', async() => {
    roomStub.callsFake(() => {
      throw new Error('Room not found');
    });

    const res = await handlePauseProducerRequest({
      roomId: 'room',
      userId: 'user',
      producerId: 'producer'
    });

    expect(res.action).toEqual('pauseProducer');
    expect(res.error).toEqual('Room not found');
  });
});
