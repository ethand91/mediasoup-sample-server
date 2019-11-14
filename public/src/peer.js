const { EventEmitter } = require('events');
const mediasoup = require('mediasoup-client');

const { GUM } = require('./gum');
const Socket = require('./socket');

module.exports = class Peer extends EventEmitter {
  constructor () {
    super();
    this._socket = new Socket();
    this._mediasoupDevice = new mediasoup.Device();
    this._joined = false;

    this._transports = [];
    this._producers = [];
    this._consumers = [];

    this._remoteStreams = new Map();

    this._socket.on('message', this._handleSocketMessage.bind(this));
  }

  async initialize (socketUrl) {
    await this._socket.connect(socketUrl);
    const response = await this._socket.sendWithAck({
      action: 'getRoomRtpCapabilities',
      roomId: 'android'
    });

    await this._mediasoupDevice.load({ routerRtpCapabilities: response.roomRtpCapabilities });
    console.log('initialize() complete [routerRtpCapabilities:%o]', response.roomRtpCapabilities);
  }

  async join () {
    const response = await this._socket.sendWithAck({
      action: 'loginRoom',
      roomId: 'android',
      rtpCapabilities: this._mediasoupDevice.rtpCapabilities
    });

    console.log('join() [response:%o]', response);
    this._joined = true;
  }

  async createSendTransport () {
    const response = await this._createTransport('send');
    console.log('createSendTransport() [response:%o]', response);

    const sendTransport = await this._mediasoupDevice.createSendTransport(response.webRtcTransportData);
    console.log('createSendTransport() created [id:%s]', sendTransport.id);

    this._transports.push(sendTransport);

    sendTransport.on('connectionstatechange', connectionState =>
      console.log('sendTransport::connectionstatechange [newState:%s]', connectionState)
    );

    sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        const response = await this._socket.sendWithAck({
          action: 'connectWebRtcTransport',
          roomId: 'android',
          transportId: sendTransport.id,
          dtlsParameters
        });

        callback();
        console.log('sendTransport::connect handled');
      } catch (error) {
        console.error('sendTransport::connect failed [error:%o]', error);
        errback(error);
      }
    });

    sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const response = await this._socket.sendWithAck({
          action: 'produce',
          roomId: 'android',
          transportId: sendTransport.id,
          kind,
          rtpParameters
        });

        callback({ id: response.producerId });
        console.log('sendTransport::produce handled');
        this.emit('produce', kind);
      } catch (error) {
        console.error('sendTransport::produce failed [error:%o]', error);
        errback(error);
      }
    });
  }

  async createRecvTransport () {
    const response = await this._createTransport('recv');
    console.log('createRecvTransport() [response:%o]', response);

    const recvTransport = await this._mediasoupDevice.createRecvTransport(response.webRtcTransportData);
    console.log('createRecvTransport() created [id:%s]', recvTransport.id);

    this._transports.push(recvTransport);

    recvTransport.on('connectionstatechange', connectionState =>
      console.log('recvTransport::connectionstatechange [newState:%s]', connectionState)
    );

    recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        const response = await this._socket.sendWithAck({
          action: 'connectWebRtcTransport',
          roomId: 'android',
          transportId: recvTransport.id,
          dtlsParameters
        });

        callback();
        console.log('recvTransport::connect handled');
      } catch (error) {
        console.error('recvTransport::connect failed [error:%o]', error);
        errback(error);
      }
    });
  }

  async publish (audio = true, video = true) {
    // Check if the user can produce media
    if (audio && !this._mediasoupDevice.canProduce('audio')) {
      throw new Error('Cannot publish audio');
    }

    if (video && !this._mediasoupDevice.canProduce('video')) {
      throw new Error('Cannot publish video');
    }

    // Get the user's media
    const mediaStream = await GUM();

    // Create send Transport if not already created
    const sendTransport = this._transports.find(
      transport => transport.direction === 'send'
    );

    if (!sendTransport) {
      console.warn('publish() send transport was not created so creating...');
      await this.createSendTransport();
    }

    if (mediaStream.getVideoTracks()[0]) {
      const videoProducer = await sendTransport.produce({ track: mediaStream.getVideoTracks()[0] });
      this._producers.push(videoProducer);
    }

    if (mediaStream.getAudioTracks()[0]) {
      const audioProducer = await sendTransport.produce({ track: mediaStream.getAudioTracks()[0] });

      this._producers.push(audioProducer);
    }

    return mediaStream;
  }

  async play (consumerInfo) {
    let recvTransport = this._transports.find(
      transport => transport.direction === 'recv'
    );

    if (!recvTransport) {
      console.warn('no recv transport found creating...');
      recvTransport = await this.createRecvTransport(); 
    }

    let remoteMediaStream = this._remoteStreams.get(consumerInfo.producerUserId);

    if (!remoteMediaStream) {
      remoteMediaStream = new MediaStream();
      this._remoteStreams.set(consumerInfo.producerUserId, remoteMediaStream);
    }

    const kindConsumer = await recvTransport.consume(consumerInfo);
    this._consumers.push(kindConsumer);

    remoteMediaStream.addTrack(kindConsumer.track);

    if (!document.getElementById(consumerInfo.producerUserId) && kindConsumer.kind === 'video') {
      this._createRemoteVideoDiv(consumerInfo.producerUserId, remoteMediaStream);
    }

    // unmute remote consumer
    const response = await this._socket.sendWithAck({
      action: 'resumeConsumer',
      roomId: 'android',
      userId: consumerInfo.consumerUserId,
      consumerId: kindConsumer.id
    });

    console.log('res', response);
  }

  _createRemoteVideoDiv(id, remoteStream) {
    const videoNode = document.createElement('video');
    videoNode.id = id;
    videoNode.autoplay = true;
    videoNode.srcObject = remoteStream;
    videoNode.load();

    const divNode = document.getElementById('remoteVideos');
    divNode.appendChild(videoNode);
  }

  _createTransport (direction) {
    if (!this._joined) {
      throw new Error('Room is not joined');
    }

    return this._socket.sendWithAck({
      action: 'createWebRtcTransport',
      roomId: 'android',
      direction 
    });
  }

  get rtpCapabilities () {
    return this._mediasoupDevice.rtpCapabilities;
  }

  async _handleSocketMessage (message) {
    try {
      switch(message.action) {
        case 'newuser':
          console.log('socket::newuser [id:%s]', message.userId);
          this.emit('newuser', message.userId);
          break;
        case 'newconsumer':
          console.log('newconsumer [consumerData:%o]', message.consumerData);
          await this.play(message.consumerData); 
          break;
      }
    } catch (error) {
      console.error('_handleSocketMessage() failed [error:%o]', error);
    }
  }
}
