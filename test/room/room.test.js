const { Room } = require('./../../src/room');
const Worker = require('./../../src/worker');
const dtlsParameters = require('./mockDtlsParameters');
const rtpParameters = require('./mockRtpParameters');

describe('Room', () => {
  let room;

  beforeAll(async () => Worker.initializeWorkers());
  beforeEach(async () => room = await Room.create({ roomId: 'room' }));
  afterAll(() => Worker.releaseWorkers());

  it('should be an instance of Room class', () => {
    expect(room).toBeInstanceOf(Room);
    expect(room.closed).toBeFalsy();
  });

  describe('login', () => {
    it('should emit a newuser event on user login', done => {
      room.once('newuser', ({ userId }) => {
        expect(userId).toEqual('user');
        done();
      });

      room.login({ userId: 'user', rtpCapabilities: undefined });
    });

    it('should throw an error if the userId already exists', () => {
      room.login({ userId: 'user', rtpCapabilities: undefined });
      expect(() => {
        room.login({ userId: 'user', rtpCapabilities: undefined });
      }).toThrowError(new Error('User with id user already exists'));
    });
  });

  describe('logout', () => {
    it('should emit a userclose event on user logout', done => {
      room.once('userclose', ({ userId }) => {
        expect(userId).toEqual('user');
        done();
      });

      room.login({ userId: 'user' });
      room.logout('user');
    });

    it('should throw an error if user was not found', () => {
      expect(() => {
        room.logout('user');
      }).toThrowError(new Error('User with id user was not found'));
    });
  });

  describe('createWebRtcTransport', () => {
    beforeEach(() => room.login({ userId: 'user' }));

    it('should throw an error if direction is neither send/recv', async () => {
      try {
        await room.createWebRtcTransport({ userId: 'user', direction: 'sendrecv' });
        throw new Error('Fail');
      } catch (error) {
        expect(error.message).toEqual('Invalid direction sendrecv');
      }
    });

    it('should throw an error if user does not exist', async () => {
      try {
        await room.createWebRtcTransport({ userId: 'null', direction: 'send' });
      } catch (error) {
        expect(error.message).toEqual('User with id null was not found');
      }
    });

    it('should return transport info on success', async () => {
      const transportData = await room.createWebRtcTransport({ userId: 'user', direction: 'recv' });
      expect(transportData.id).not.toBeUndefined();
      expect(transportData.iceParameters).not.toBeUndefined();
      expect(transportData.iceCandidates).not.toBeUndefined();
      expect(transportData.dtlsParameters).not.toBeUndefined();
    });
  });

  describe('connectWebRtcTransport', () => {
    let transportData;

    beforeEach(async () => {
      room.login({ userId: 'user' });
      transportData = await room.createWebRtcTransport({ userId: 'user', direction: 'send' });
    });

    it('should throw an error if user does not exist', async () => {
      try {
        await room.connectWebRtcTransport({
          userId: 'null',
          transportId: 'null',
          dtlsParameters: {}
        });
        throw new Error('Fail');
      } catch (error) {
        expect(error.message).toEqual('User with id null was not found');
      }
    });

    it('should throw an error if transport does not exist', async () => {
      try {
        await room.connectWebRtcTransport({ userId: 'user', transportId: 'null', dtlsParameters: {} });
        throw new Error('Fail');
      } catch (error) {
        expect(error.message).toEqual('Transport with id null was not found');
      }
    });

    it('should resolve if successful', async () => {
      await room.connectWebRtcTransport({ userId: 'user', transportId: transportData.id, dtlsParameters });
    });
  });

  describe('createProducer', () => {
    let transportData;

    beforeEach(async () => {
      room.login({ userId: 'user' });
      transportData = await room.createWebRtcTransport({ userId: 'user', direction: 'send' });
      await room.connectWebRtcTransport({ userId: 'user', transportId: transportData.id, dtlsParameters });
    });

    it('should throw an error if user does not exist', async () => {
      try {
        await room.createProducer({ userId: 'null' });
        throw new Error('Fail');
      } catch (error) {
        expect(error.message).toEqual('User with id null was not found');
      }
    });

    it('should throw an error if transport does not exist', async () => {
      try {
        await room.createProducer({ userId: 'user', transportId: 'null' });
      } catch (error) {
        expect(error.message).toEqual('Transport with id null was not found');
      }
    });

    it('should create and return the id of the producer', async () => {
      const producerData = await room.createProducer({
        userId: 'user',
        transportId: transportData.id, 
        kind: 'video',
        rtpParameters
      });

      expect(producerData.id).not.toBeUndefined();
    });
  });

  describe('pauseProducer', () => {
    let producerData;

    beforeEach(async () => {
      room.login({ userId: 'user' });
      const transportData = await room.createWebRtcTransport({ userId: 'user', direction: 'send' });
      await room.connectWebRtcTransport({ userId: 'user', transportId: transportData.id, dtlsParameters });
      producerData = await room.createProducer({ userId: 'user', transportId: transportData.id, kind: 'video', rtpParameters });
    });

    it('should throw an error if user does not exists', async () => {
      try {
        await room.pauseProducer({ userId: 'null' });
        throw new Error('Fail');
      } catch (error) {
        expect(error.message).toEqual('User with id null was not found');
      }
    });

    it('should throw an error if producer does not exist', async () => {
      try {
        await room.pauseProducer({ userId: 'user', producerId: 'null' });
        throw new Error('Fail');
      } catch (error) {
        expect(error.message).toEqual('Producer with id null was not found');
      }
    });

    it('should resolve', async () => {
      await room.pauseProducer({ userId: 'user', producerId: producerData.id });
    });
  });
});
