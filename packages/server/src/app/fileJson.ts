import {
  existsSync,
  createReadStream,
  createWriteStream,
  writeFileSync,
} from 'fs'
import { resolve } from 'path'
import { Readable } from 'stream'

export type FileJSON = {
  files: Record<
    string,
    {
      type: string
      allDone: boolean
      fileName: string
      chunkHashList: { hash: string; done: boolean }[]
    }
  >
  partial: Record<
    string,
    {
      parent: string
    }
  >
}

let fileObj: FileJSON = { files: {}, partial: {} }

const handler = {
  get(target, key) {
    return Reflect.get(target, key)
  },
  set(target, key, value) {
    if (typeof value === 'object') {
      value = createProxy(value)
    }
    const res = Reflect.set(target, key, value)
    writeFiles(fileObj)
    return res
  },
}

function createProxy(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      obj[key] = createProxy(obj[key])
    }
  }
  return new Proxy(obj, handler)
}
const fileJsonPath = resolve(__dirname, 'files.json')

const isFileExisting = existsSync(fileJsonPath)
!isFileExisting && writeFileSync(fileJsonPath, '')
export let fileJson = !isFileExisting ? createProxy(fileObj) : fileObj

export const getFiles = () => {
  const fileJsonRead = createReadStream(fileJsonPath)

  let data = ''
  fileJsonRead.on('data', (chunk) => {
    data += chunk
  })
  return new Promise((resolve, reject) => {
    fileJsonRead.on('end', () => {
      resolve(data)
    })
    fileJsonRead.on('error', (e) => reject(e))
  })
}

isFileExisting &&
  getFiles()
    .then((str: string) => {
      if (str) {
        fileObj = JSON.parse(str)
        fileJson = createProxy(fileObj)
      }
    })
    .catch((e) => {
      console.log('Error in first getFilesJSON: ', e)
    })

export const writeFiles = (json: any) => {
  const fileJsonWrite = createWriteStream(fileJsonPath)
  const strReadSteam = new Readable()
  strReadSteam.pipe(fileJsonWrite)
  strReadSteam.push(JSON.stringify(json))
  strReadSteam.push(null)
}
