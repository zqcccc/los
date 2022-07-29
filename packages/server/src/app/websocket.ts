import { Server } from 'http';
import { WebSocketServer } from 'ws';
// import { parse } from 'query-string';
// import { readFile, readdir } from 'fs/promises';
// import { resolve } from 'path';

const list: { type: string; value: string }[] = [];

export default (expressServer: Server) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: '/websockets',
  });

  const socketMap = new Map();

  expressServer.on('upgrade', (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit('connection', websocket, request);
    });
  });

  websocketServer.on(
    'connection',
    function connection(websocketConnection, connectionRequest) {
      const key = connectionRequest.headers['sec-websocket-key'];
      let timer;
      const aliveHandle = () => {
        // console.log('pong key: ', key)
        clearTimeout(timer);
        socketMap.set(key, {
          instance: websocketConnection,
          isAlive: true,
        });
        timer = setTimeout(() => {
          socketMap.delete(key);
          websocketConnection.terminate();
        }, 10000);
      };
      websocketConnection.ping();
      websocketConnection.on('pong', aliveHandle);
      websocketConnection.on('message', (message) => {
        const parsedMessage = JSON.parse(message.toString());
        const type = parsedMessage.type;
        const res = {
          time: Date.now(),
          type,
          value: parsedMessage.value,
        };
        list.push(res);
        websocketServer.clients.forEach((client) => {
          client.send(JSON.stringify(res));
        });
      });
      websocketConnection.on('close', () => {
        clearTimeout(timer);
      });

      if (list.length)
        websocketConnection.send(
          JSON.stringify({ type: 'history', value: list })
        );
      // setTimeout(() => {
      //   readFile(resolve(__dirname, 'assets/images.png')).then((buf) =>
      //     websocketConnection.send(
      //       JSON.stringify({ type: 'picture', value: '/images.png' })
      //     )
      //   );
      // }, 1000);
    }
  );

  setInterval(() => {
    websocketServer.clients.forEach((client) => {
      client.ping();
    });
  }, 3000);

  return {
    server: websocketServer,
    broadcast: (message) => {
      websocketServer.clients.forEach((client) => {
        client.send(JSON.stringify(message));
      });
      list.push(message);
    },
  };
};
