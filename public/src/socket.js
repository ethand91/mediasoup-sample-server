const { EventEmitter } = require('events');

const { timeoutPromise } = require('./utils');

// Seconds to wait before connection timeout
const CONNECT_TIMEOUT_MS = 3000;
// Seconds to wait before receiving ack response
const ACK_TIMEOUT_MS = 3000;

module.exports = class Socket extends EventEmitter {
  constructor () {
    super();

    this._socket = undefined;
    this._queue = [];
  }

  async connect (url) {
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      throw new Error(`Invalid websocket url ${url}`);
    }

    if (this._socket &&
      (this._socket.readyState === WebSocket.OPEN || this._socket.readyState === WebSocket.CONNECTING)) {
      console.warn(`Socket is already ${this._socket.readyState}`);
      return;
    }

    return await this._innerConnect(url);
  }

  send (message) {
    if (!this.connected) {
      throw new Error('Invalid state');
    }

    this._socket.send(JSON.stringify(message));
  }

  sendWithAck (message) {
    console.log('sendWithAck() [message:%o]', message);
    if (!this.connected) {
      throw new Error('Invalid state');
    }

    const { action } = message;

    const ackPromise = new Promise((resolve, reject) => {
      let handleAckMessageEvent = message => {
        try {
          console.log('got message', message);
          console.log('TEST');
          const jsonMessage = JSON.parse(message.data);
          console.log('action1', action);
          console.log('action2', jsonMessage.action);
          console.log('match', jsonMessage.action === action);

          if (jsonMessage.action === action) {
            console.log('resolve');
            this._socket.removeEventListener('message', handleAckMessageEvent);
            return resolve(jsonMessage);
          }
        } catch (error) {
          reject(error);
        }
      };

      handleAckMessageEvent = handleAckMessageEvent.bind(this);
      this._socket.addEventListener('message', handleAckMessageEvent); 
      this._socket.send(JSON.stringify(message));
    });

    return timeoutPromise(ackPromise, ACK_TIMEOUT_MS);
  }

  get connected () {
    return this._socket && this._socket.readyState === WebSocket.OPEN;
  }

  _innerConnect (url) {
    console.log('_innerConnect()');
    const connectPromise = new Promise(resolve => {
      this._socket = new WebSocket(url);

      const handleSocketOpenEvent = () => {
        console.log('handleSocketOpenEvent');
        this._socket.removeEventListener('open', handleSocketOpenEvent.bind(this));
        this._setSocketListeners();
        resolve();
      };

      this._socket.addEventListener('open', handleSocketOpenEvent.bind(this));
    });

    return timeoutPromise(connectPromise, CONNECT_TIMEOUT_MS);
  }

  _setSocketListeners () {
    this._socket.addEventListener('message', this._handleSocketMessageEvent.bind(this));
    this._socket.addEventListener('close', this._handleSocketCloseEvent.bind(this));
    this._socket.addEventListener('error', this._handleSocketErrorEvent.bind(this));
  }

  _handleSocketMessageEvent (message) {
    try {
      console.log('handleSocketMessageEvent', message);

      const jsonMessage = JSON.parse(message.data);
      this.emit('message', jsonMessage);
    } catch (error) {
      console.error('_handleSocketMessageEvent() failed to parse message [error:%o]', error);
    }
  }

  _handleSocketCloseEvent () {
    console.log('_handleSocketCloseEvent()');

    this._socket.removeEventListener('message', this._handleSocketMessageEvent.bind(this));
    this._socket.removeEventListener('close', this._handleSocketCloseEvent.bind(this));
    this._socket.removeEventListener('error', this._handleSocketErrorEvent.bind(this));

    this._socket = undefined;
    this.emit('close');
  }

  _handleSocketErrorEvent (error) {
    console.error('_handleSocketErrorEvent() [error:%o]', error);
    this.emit('error', error);
  }
}
