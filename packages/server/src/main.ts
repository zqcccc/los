/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express';
import * as http from 'http';

import { addresses } from './app/ip';
import websocket from './app/websocket';

const app = express();

const server = http.createServer(app);

websocket(server);

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to server!' });
});

const port = process.env.port || 3333;
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  console.log(`Listening at http://${addresses[0]}:${port}/api`);
});
server.on('error', console.error);
