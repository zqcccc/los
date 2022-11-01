/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express'
import { createWriteStream } from 'fs'
import * as http from 'http'
import { resolve } from 'path'

import mime from './utils/mime'
import { addresses } from './app/ip'
import websocket from './app/websocket'

const app = express()

const server = http.createServer(app)

const { broadcast } = websocket(server)

app.use('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  next()
})

// static frontend resource
app.use('/client', express.static(resolve(__dirname, '../client')))

app.post('/upload', (req, res) => {
  const contentType = req.headers['content-type']
  console.log('contentType: ', contentType)
  if (!contentType) {
    res.send('Header content-type required')
    return
  }
  const fileName = req.headers['file-name'] as string
  if (!fileName) {
    res.send('Header file-name required')
    return
  }
  const [fileType] = contentType.split('/')
  const exts = mime.getExtensions(contentType)

  let assetName = decodeURIComponent(fileName)
  console.log('assetName: ', assetName)
  if (exts && exts.length) {
    const hasExt = exts?.some((ext) => assetName.endsWith(`.${ext}`))
    assetName = `${assetName}${hasExt ? '' : `.${exts[0]}`}`
  }

  const write = createWriteStream(resolve(__dirname, `assets/${assetName}`))
  req.pipe(write)
  write.on('close', () => {
    console.log('write close')
    // broadcast
    broadcast({ type: fileType, value: assetName })
    res.end('successfully upload')
  })
  write.on('error', (err) => {
    res.end(err.toString())
  })
})

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to server!' })
})

app.use(express.static(resolve(__dirname, 'assets')))

const port = process.env.PORT || 3333
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`)
  console.log(`Listening at http://${addresses[0]}:${port}/api`)
})
server.on('error', console.error)
