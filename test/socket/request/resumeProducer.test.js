const { stub } = require('sinon');

const Room = require('.;/../../../src/room');
const { handleResumeProducerRequest } = require('./../../../src/socket/request');
const RoomObject = require('./roomObject');

describe('handleResumeProducerRequest()', () => {
  let roomStub;

  beforeAll(() => roomStub = stub(Room, 'getRoomById'));
  afterAll(() => roomStub.restore());

  it('should return only the action if request succeeded', async () => {
    roomStub.callsFake(() => RoomObject);
    const res = await handleResumeProducerRequest({
      userId: 'user',
      roomId: 'room',
      producerId: 'producer'
    });

    expect(res.action).toEqual('resumeProducer');
    expect(res.error).toBeUndefined();
  });

  it('should return an error if the request failed', async () => {
    roomStub.callsFake(() => {
      throw new Error('Room was not found');
    });

    const res = await handleResumeProducerRequest({
      userId: 'user',
      roomId: 'room',
      producerId: 'producer'
    });

    expect(res.action).toEqual('resumeProducer');
    expect(res.error).toEqual('Room was not found');
  });
});
