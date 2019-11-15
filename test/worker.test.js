const os = require('os');

const Worker = require('./../src/worker');

describe('Worker module', () => {
  const cpuLength = Object.keys(os.cpus()).length;

  afterEach(() => Worker.releaseWorkers());

  describe('intializeWorkers()', () => {
    it('should intialize workers', async () => {
      await Worker.initializeWorkers(); 
      expect(Worker.size()).toEqual(cpuLength);
    });

    it('should throw an error if workers are already initialized', async () => {
      try {
        await Worker.initializeWorkers();
        await Worker.initializeWorkers();
        throw new Error('Fail');
      } catch (error) {
        expect(error.message).toEqual('Workers already initialized');
        expect(Worker.size()).toEqual(cpuLength);
      }
    });
  });

  describe('getNextWorker()', () => {
    beforeEach(() => Worker.initializeWorkers());

    it('should return a worker', () => {
      expect(Worker.getNextWorker()).not.toBeUndefined();
    });

    it('should reloop through the workers if length is exceeded', () => {
      const worker = Worker.getNextWorker();

      for (let i = 0; i < (cpuLength - 1); i++) {
        Worker.getNextWorker();
      }

      expect(Worker.getNextWorker()).toEqual(worker);
    });
  });

  describe('releaseWorkers()', () => {
    beforeEach(() => Worker.initializeWorkers());

    it('should release all of the workers', () => {
      Worker.releaseWorkers();
      expect(Worker.size()).toEqual(0);
    });
  });
});
