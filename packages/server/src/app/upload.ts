import { Express } from 'express'
import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { streamMergeRecursive } from '../utils/combineBinary'
import { fileJson } from './fileJson'
import mime from '../utils/mime'

export default function (app: Express, broadcast: (message: any) => void) {
  // 大文件分片上传前检查
  app.post('/upload/before', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const record = fileJson.files[req.body.md5]
    if (record) {
      if (record.allDone) {
        const wsMsg = {
          from: ip,
          type: record.type.split('/')[0] || 'file',
          value: record.fileName,
        }
        console.log('wsMsg: ', wsMsg)
        broadcast(wsMsg)
        res.json({ allDone: true })
      } else {
        res.json({ chunkHashList: record.chunkHashList.filter((i) => !i.done) })
      }
    } else {
      const toRecord = {
        ...req.body,
        from: ip,
        chunkHashList: req.body.chunkHashList.map((hash: string) => {
          fileJson.partial[hash] = { parent: req.body.md5 }
          return {
            hash,
            done: false,
          }
        }),
      }
      fileJson.files[req.body.md5] = toRecord
      res.json({ hasUpload: null, chunkHashList: toRecord.chunkHashList })
    }
  })

  // 大文件分片上传
  app.post('/upload/partial', (req, res) => {
    const fileName = req.headers['file-name'] as string
    if (!fileName) {
      res.status(400)
      res.end('Header file-name required')
      return
    }

    const localPartial = fileJson.partial[fileName]
    if (!localPartial) {
      res.status(400)
      res.end('unknown hash')
      return
    }

    const parent = fileJson.files[localPartial.parent]
    if (!parent) {
      res.status(400)
      res.end('no parent file')
      return
    }

    const write = createWriteStream(resolve(__dirname, `assets/${fileName}`))
    req.pipe(write)
    let errClose = false
    write.on('close', () => {
      if (errClose) return
      const allDone = parent.chunkHashList
        .map((item) => {
          if (item.hash === fileName) item.done = true
          return item.done
        })
        .every((isDone) => isDone)

      if (allDone) {
        console.log('上传结束:', parent)
        streamMergeRecursive(
          parent.chunkHashList.map((sub) =>
            resolve(__dirname, `assets/${sub.hash}`)
          ),
          createWriteStream(resolve(__dirname, `assets/${parent.fileName}`))
        ).then(() => {
          parent.allDone = true
          broadcast({
            from: parent.from,
            type: parent.type.split('/')[0] || 'file',
            value: parent.fileName,
          })
          res.json({ allDone: true })
        })
      } else {
        console.log('partial write close')
        res.json({ allDone: false, msg: 'partial successfully upload' })
      }
    })
    write.on('error', (err) => {
      res.end(err.toString())
      errClose = true
      write.close()
    })
  })

  // 小文件上传
  app.post('/upload', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
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
      broadcast({ from: ip, type: fileType, value: assetName })
      res.end('successfully upload')
    })
    write.on('error', (err) => {
      res.end(err.toString())
    })
  })
}
