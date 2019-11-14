const { createWorker } = require('mediasoup');

const config = require('./config');

const workers = [];
let nextWorkerIndex = 0;

module.exports.initializeWorkers = async () => {
  console.log('initializeWorkers() [num:%d]', config.numWorkers);

  for (let i = 0; i < config.numWorkers; ++i) {
    const worker = await createWorker(config.worker);

    worker.once('died', () => {
      console.error('worker::died [pid:%d] exiting in 2 seconds...', worker.pid);
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }
};

module.exports.getNextWorker = () => {
  const worker = workers[nextWorkerIndex];

  if (++nextWorkerIndex === workers.length) {
    nextWorkerIndex = 0;
  }

  return worker;
};

module.exports.releaseWorkers = () => {
  for (const worker of workers) {
    worker.close();
  }

  workers.length = 0;
};
