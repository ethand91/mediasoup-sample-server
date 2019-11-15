module.exports.User = class User {
  constructor ({ userId, rtpCapabilities }) {
    this._id = userId;
    this._rtpCapabilities = rtpCapabilities;
    this._transports = new Map();
    this._producers = new Map();
    this._consumers = new Map();
  }

  close () {
    for (const consumer of Array.from(this._consumers.values())) {
      consumer.close();
      this._consumers.delete(consumer.id);
    }

    for (const producer of Array.from(this._producers.values())) {
      producer.close();
      this._producers.delete(producer.id);
    }

    for (const transport of Array.from(this._transports.values())) {
      transport.close();
      this._transports.delete(transport.id);
    }
  }

  get id () { return this._id; }
  get transports () { return this._transports; }
  get producers () { return this._producers; }
  get consumers () { return this._consumers; }
  get rtpCapabilities () { return this._rtpCapabilities; }
}
