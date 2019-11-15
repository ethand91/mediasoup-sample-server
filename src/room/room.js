const { EventEmitter } = require('events');

const config = require('./../config');
const { User } = require('./../user');
const { getNextWorker } = require('./../worker');

module.exports.Room = class Room extends EventEmitter {
  static async create({ roomId }) {
    console.log('Room::create [id:%s]', roomId);

    const worker = getNextWorker();
    const mediasoupRouter = await worker.createRouter(config.router);

    return new Room({ roomId, mediasoupRouter });
  }

  constructor ({ roomId, mediasoupRouter }) {
    super();
    this.setMaxListeners(Infinity);

    this._id = roomId;
    this._closed = false;
    this._mediasoupRouter = mediasoupRouter;

    this._users = new Map();
  }

  login ({ userId, rtpCapabilities }) {
    console.log('login() [id:%s, userId:%s]', this._id, userId);
    if (this._users.has(userId)) {
      throw new Error(`User with id ${userId} already exists`);
    }

    const user = new User({ userId, rtpCapabilities });
    this._users.set(userId, user);

    this.emit('newuser', { userId: user.id });
  }

  logout (userId) {
    const user = this._getUserById(userId);
    user.close();

    this._users.delete(userId); 
    this.emit('userclose', { userId });
  }

  async createWebRtcTransport ({ userId, direction }) {
    console.log('createWebRtcTransport() [id:%s, userId:%s, direction:%s]', this._id, userId, direction);
    if (direction !== 'send' && direction !== 'recv') {
      throw new Error(`Invalid direction ${direction}`);
    }

    const user = this._getUserById(userId);

    const transportOptions = {
      ...config.webRtcTransport,
      appData: { direction }
    };
    const webRtcTransport = await this._mediasoupRouter.createWebRtcTransport(transportOptions);

    user.transports.set(webRtcTransport.id, webRtcTransport);

    if (direction === 'recv') {
      // Create consumers
      for (const loggedInUser of Array.from(this._users.values())) {
        for (const producer of Array.from(loggedInUser.producers.values())) {
          await this._createConsumer({
            consumerUser: user,
            producerUser: loggedInUser,
            producer
          });
        }
      }
    }

    return {
      id: webRtcTransport.id,
      iceParameters: webRtcTransport.iceParameters,
      iceCandidates: webRtcTransport.iceCandidates,
      dtlsParameters: webRtcTransport.dtlsParameters
    };
  }

  async connectWebRtcTransport ({ userId, transportId, dtlsParameters }) {
    const user = this._getUserById(userId);
    const transport = this._getTransportById(user, transportId);

    await transport.connect({ dtlsParameters });
    console.log('connectWebRtcTransport() transport connected [id:%s, transport.id:%s, transport.direction:%s', this._id, transportId, transport.appData.direction);
  }

  async createProducer ({ userId, transportId, kind, rtpParameters }) {
    const user = this._getUserById(userId);
    const transport = this._getTransportById(user, transportId);

    const producer = await transport.produce({ kind, rtpParameters });
    user.producers.set(producer.id, producer);

    // Optimization create server side consumers
    for (const loggedInUser of Array.from(this._users.values())) {
      // Dont create consumer for self
      if (loggedInUser.id === userId) {
        continue;
      }

      console.log('createProducer() create consumer [id:%s, producer.id:%s, userId:%s]', this._id, producer.id, loggedInUser.id);
      await this._createConsumer({
        consumerUser: loggedInUser,
        producerUser: user,
        producer
      });
    }

    producer.on('transportclose', () => {
      console.log('producer::transportclose [id:%s, producer.id:%s]', this._id, producer.id);
      user.producers.delete(producer.id);
    });

    producer.on('score', score => {
      console.log('producer::score [id:%s, producer.id:%s, producer.kind:%s, score:%o]', this._id, producer.id, producer.kind, score);
    });

    producer.on('videoorientationchange', orientation => {
      console.log('producer::videoorientationchange [id:%s, producer.id:%s, orientation:%o]', this._id, producer.id, orientation); 
    });

    producer.observer.once('close', () => {
      console.log('producer::close [id:%s, producer.id:%s, producer.kind:%s]', this._id, producer.id, producer.kind);
      user.producers.delete(producer.id);
    });

    return { id: producer.id };
  }

  async pauseProducer ({ userId, producerId }) {
    console.log('pauseProducer');

    const user = this._getUserById(userId);
    const producer = this._getProducerById(user, producerId);

    await producer.pause();
  }

  async resumeProducer ({ userId, producerId }) {
    console.log('resumeProducer()');

    const user = this._getUserById(userId);
    const producer = this._getProducerById(user, producerId);

    await producer.resumse();
  }

  closeProducer ({ userId, producerId }) {
    console.log('closeProducer');

    const user = this._getUserById(userId);
    const producer = this._getProducerById(user, producerId);

    producer.close();
    user.producers.delete(producerId);
  }

  async pauseConsumer ({ userId, consumerId }) {
    console.log('pauseConsumer()');

    const user = this._getUserById(userId);
    const consumer = this._getConsumerById(user, consumerId);

    await consumer.pause();
  }

  async _createConsumer ({ consumerUser, producerUser, producer }) {
    console.log('_createConsumer [consumerUserId:%s, producerUserId:%s]', consumerUser.id, producerUser.id);
    // Don't create the consumer if it is not supported
    if (!this._mediasoupRouter.canConsume({
      producerId: producer.id,
      rtpCapabilities: consumerUser.rtpCapabilities
    })) {
      console.log('_createConsumer() cannot consume producer [id:%s, consumerUser.id:%s, producer.id:%s]', this._id, consumerUser.id, producer.id);

      return;
    }

    const recvTransport = Array.from(consumerUser.transports.values())
      .find(transport => transport.appData.direction === 'recv');

    if (!recvTransport) {
      console.log('_createConsumer() no recv transport found [id:%s, consumerUser.id:%s]', this._id, consumerUser.id);

      return;
    }

    // Create the consumer in paused mode
    let consumer;

    try {
      consumer = await recvTransport.consume({
        producerId: producer.id,
        rtpCapabilities: consumerUser.rtpCapabilities,
        paused: true
      });
    } catch (error) {
      console.error('_createConsumer() failed to create consumer [id:%s, consumerUser.id:%s, recvTransport.id:%s, error:%o]', this._id, consumerUser.id, recvTransport.id, error);

      return;
    }

    console.log('_createConsumer() consumer created [id:%s, consumerUser.id:%s, consumer.id:%s, consumer.kind:%s]', this._id, consumerUser.id, consumer.id, consumer.kind);
    // Store the consumer
    consumerUser.consumers.set(consumer.id, consumer);

    consumer.once('transportclose', () => {
      console.log('consumer::transportclose [id:%s]', consumer.id);
      consumerUser.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      console.log('consumer::producerclose [id:%s]', consumer.id);

      this.emit('consumerclosed', consumerUser.id, consumer.id);
    });

    consumer.on('producerpause', () => {
      console.log('consumer::producerpause [id:%s]', consumer.id);

      this.emit('producerpause', consumerUser.id, consumer.id);
    });

    consumer.on('producerresume', () => {
      console.log('consumer::producerresume [id:%s]', consumer.id);

      this.emit('producerresume', consumerUser.id, consumer.id);
    });

    consumer.on('score', score => {
      console.log('consumer::score [id:%s, score:%o]', consumer.id, score);

      this.emit('score', consumerUser.id, score);
    });

    this.emit('newconsumer', {
      consumerUserId: consumerUser.id,
      producerUserId: producerUser.id,
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: producer.paused
    });
  }

  async resumeConsumer ({ userId, consumerId }) {
    console.log('resumeConsumer [id:%s, userId:%s, consumer.id:%s]', this._id, userId, consumerId);
    const user = this._getUserById(userId);
    const consumer = this._getConsumerById(user, consumerId);

    await consumer.resume();
  }

  closeConsumer ({ userId, consumerId }) {
    console.log('closeConsumer()');

    const user = this._getUserById(userId);
    const consumer = this._getConsumerById(user, consumerId);

    consumer.close();
    user.consumers.delete(consumerId);
  }

  close () {
    console.log('close() [id:%s]', this._id);

    this._closed = true;
    this._mediasoupRouter.close();

    for (const user of Array.from(this._users.values())) {
      user.close();
    }

    this.emit('close');
  }

  _getUserById (userId) {
    const user = this._users.get(userId);

    if (!user) {
      throw new Error(`User with id ${userId} was not found`);
    }

    return user;
  }

  _getTransportById (user, transportId) {
    const transport = user.transports.get(transportId);

    if (!transport) {
      throw new Error(`Transport with id ${transportId} was not found`);
    }

    return transport;
  }

  _getProducerById (user, producerId) {
    const producer = user.producers.get(producerId);

    if (!producer) {
      throw new Error(`Producer with id ${producerId} was not found`);
    }

    return producer;
  }

  _getConsumerById (user, consumerId) {
    const consumer = user.consumers.get(consumerId);

    if (!consumer) {
      throw new Error(`Consumer with id ${consumerId} was not found`);
    }

    return consumer;
  }

  get id () { return this._id; }
  get routerRtpCapabilities () { return this._mediasoupRouter.rtpCapabilities; }
}
