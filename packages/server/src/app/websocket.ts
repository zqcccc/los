
import { Server } from 'http';
import { WebSocketServer } from 'ws';
// import { parse } from 'query-string';
import { parse } from 'url';

export default (expressServer: Server) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: '/websockets',
  });

  expressServer.on('upgrade', (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit('connection', websocket, request);
    });
  });

  websocketServer.on(
    'connection',
    function connection(websocketConnection, connectionRequest) {
      websocketConnection.on('message', (message) => {
        const parsedMessage = JSON.parse(message.toString());
        const type = parsedMessage.type
        websocketServer.clients.forEach(client => {
          client.send(JSON.stringify({ time: Date.now(), type, value: parsedMessage.value }))
        })
      });
    }
  );

  return websocketServer;
};
