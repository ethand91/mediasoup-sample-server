const { User } = require('./../src/user');

describe('User', () => {
  let user;

  beforeEach(() => user = new User({ userId: 'user' }));

  it('should be an instance of User', () => {
    expect(user).toBeInstanceOf(User);
  });

  it('should close all consumers/producers/transports', () => {
    user.transports.set('transport-1', { id: 'transport-1', close: () => {} });
    user.transports.set('transport-2', { id: 'transport-2', close: () => {} });
    user.producers.set('producer-1', { id: 'producer-1', close: () => {} });
    user.consumers.set('consumer-1', { id: 'consumer-1', close: () => {} });

    user.close();
    expect(user.transports.size).toEqual(0);
    expect(user.producers.size).toEqual(0);
    expect(user.consumers.size).toEqual(0);
  });

  it('should return rtpCapabilities', () => {
    expect(user.rtpCapabilities).toBeUndefined();
  });
});
