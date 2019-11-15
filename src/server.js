const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const { handleSocket } = require('./socket');
const { initializeWorkers } = require('./worker');

const HTTPS_OPTIONS = Object.freeze({
  cert: fs.readFileSync('./ssl/server.crt'),
  key: fs.readFileSync('./ssl/server.key')
});

const httpsServer = https.createServer(HTTPS_OPTIONS);

const wss = new WebSocket.Server({
  maxPayload: 200000000,
  server: httpsServer
}, () => console.log('WebSocket.Server started at port 8080'));

const noop = () => {};

function heartbeat () {
  this.isAlive = true;
}

(async () => {
  try {
    await initializeWorkers();

    httpsServer.listen(443, () =>
      console.log('websocket SSL server running on port 443')
    );
  } catch (error) {
    console.error('Failed to initialize workers [error:%o]', error);
  }
})();

wss.on('connection', socket => {
  socket.isAlive = true;
  socket.on('pong', heartbeat);

  // Decorate socket
  socket.broadcast = (message) => {
    for (const client of wss.clients) {
      //if (client !== socket && client.readyState === WebSocket.OPEN) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  };

  socket.emitToSocket = (socketId, message) => {
    const client = Array.from(wss.clients).find(client => client.id === socketId);

    if (!client) {
      console.error('Failed to find client with id %s', socketId);
      return;
    }

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  };

  handleSocket(socket);
});

const interval = setInterval(() => {
  /*
  for (const client of wss.clients) {
    if (!client.isAlive) {
      return client.terminate();
    }

    client.isAlive = false;
    client.ping(noop);
  }
  */
}, 3000);
