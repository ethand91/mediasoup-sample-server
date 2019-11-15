const { stub } = require('sinon');

const Room = require('./../../../src/room');
const { handlePauseConsumerRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handlePauseConsumerRequest()', () => {
  let roomStub;

  beforeAll(() => roomStub = stub(Room, 'getRoomById'));
  afterAll(() => roomStub.restore());

  it('should return only the action if request succeeded', async () => {
    roomStub.callsFake(() => RoomObject);

    const res = await handlePauseConsumerRequest({
      userId: 'user',
      roomId: 'room',
      consumerId: 'consumer'
    });
    console.log(res);

    expect(res.action).toEqual('pauseConsumer');
    expect(res.error).toBeUndefined();      
  });

  it('should return an error if the request failed', async () => {
    roomStub.callsFake(() => {
      throw new Error('Room not found');
    });

    const res = await handlePauseConsumerRequest({
      userId: 'user',
      roomId: 'room',
      consumerId: 'consumer'
    });
    console.log(res);

    expect(res.action).toEqual('pauseConsumer');
    expect(res.error).toEqual('Room not found');
  });
});
