module.exports.timeoutPromise = (promise, timeoutMs) => {
  const timeoutPromise = new Promise(reject => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      return reject(new Error('Promise Timeout'));
    }, timeoutMs);
  });

  return Promise.race([ timeoutPromise, promise ]);
};
