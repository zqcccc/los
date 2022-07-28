/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express';
import { createWriteStream } from 'fs';
import * as http from 'http';
import { resolve } from 'path';

import { addresses } from './app/ip';
import websocket from './app/websocket';

const app = express();

const server = http.createServer(app);

const { broadcast } = websocket(server);

app.use('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.post('/abc', (req, res) => {
  setTimeout(() => {
    res.send('ok');
  }, 2000);
});

app.post('/upload', (req, res) => {
  const ext = req.headers['content-type']?.split('/')[1];
  if (!ext) {
    res.send('Header content-type required');
    return;
  }
  const fileName = req.headers['file-name'] as string;
  if (!fileName) {
    res.send('Header file-name required');
    return;
  }
  const assetName = `${fileName}${fileName.endsWith(ext) ? '' : `.${ext}`}`;
  const write = createWriteStream(resolve(__dirname, `assets/${assetName}`));
  req.pipe(write);
  write.on('close', () => {
    res.send('successfully upload');
    console.log('write close');
    // broadcast
    broadcast({ type: 'image', value: assetName });
    res.end();
  });
  write.on('error', (err) => {
    res.send(err.toString());
    res.end();
  });
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to server!' });
});

app.use(express.static(resolve(__dirname, 'assets')));

const port = process.env.port || 3333;
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  console.log(`Listening at http://${addresses[0]}:${port}/api`);
});
server.on('error', console.error);
