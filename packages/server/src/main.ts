/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express'
import * as http from 'http'
import { resolve } from 'path'

import { addresses } from './app/ip'
import websocket from './app/websocket'
import { environment } from './environments/environment'
import { default as useUpload } from './app/upload'

const app = express()

const server = http.createServer(app)

const { broadcast } = websocket(server)

app.use(express.json())

app.use('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  next()
})

// static frontend resource
app.use(
  '/client',
  express.static(resolve(__dirname, '../client'), {
    setHeaders(res, path, stat) {
      if (express.static.mime.lookup(path) === 'text/html') {
        // Custom Cache-Control for HTML files
        res.setHeader('Cache-Control', 'public, max-age=0')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=2592000000')
      }
    },
  })
)

useUpload(app, broadcast)

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to server!' })
})

app.use(express.static(resolve(__dirname, 'assets')))

const port = process.env.PORT || 3333
server.listen(port, () => {
  console.log(`server is listening at http://localhost:${port}/api`)
  addresses.forEach((ip) =>
    console.log(`server is listening at http://${ip}:${port}/api`)
  )
  console.log(
    `Client may listen at http://localhost:${
      environment.production ? port : 3335
    }/client/index.html`
  )
  addresses.forEach((ip) =>
    console.log(
      `Client may listen at http://${ip}:${
        environment.production ? port : 3335
      }/client/index.html`
    )
  )
})
server.on('error', console.error)
