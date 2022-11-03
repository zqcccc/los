import SparkMD5 from 'spark-md5'
import { uploadFile } from './upload'
import { baseUri } from './uri'

export function uploadFileByPartial(
  file: File,
  progressHandle: (n: number) => void,
  hashMap: {
    chunkHashList: { hash: string }[]
  }
) {
  return new Promise((resolve, reject) => {
    if (!hashMap?.chunkHashList || !hashMap.chunkHashList.length) {
      return resolve(undefined)
    }
    const blobSlice =
      File.prototype.slice ||
      (File.prototype as any).mozSlice ||
      (File.prototype as any).webkitSlice
    const chunkSize = 1048576 * 5 // Read in chunks of 5MB
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const sparkAll = new SparkMD5.ArrayBuffer()
    // 创建md5对象
    const spark = new SparkMD5.ArrayBuffer()
    // 读取文件内容
    const fileReader = new FileReader()

    const chunkInfoList: string[] = []

    fileReader.onload = function (e: ProgressEvent<FileReader>) {
      console.log('read chunk', currentChunk + 1, 'of', chunks)
      sparkAll.append(e.target?.result as ArrayBuffer) // Append array buffer
      spark.append(e.target?.result as ArrayBuffer) // Append array buffer
      const partialHash = spark.end()
      chunkInfoList.push(partialHash)

      const next = () => {
        currentChunk++
        if (currentChunk < chunks) {
          loadNext()
        } else {
          const allHash = sparkAll.end()
          resolve(allHash)
          console.log('finished loading')
          console.info('computed hash', allHash) // Compute hash
        }
      }
      if (hashMap?.chunkHashList.find((h) => h.hash === partialHash)) {
        uploadFile(
          e.target?.result as unknown as File,
          `${baseUri}/upload/partial`,
          {
            'file-name': partialHash,
          },
          (partialProgress) => {
            progressHandle?.(
              (currentChunk / chunks) * 100 + partialProgress / chunks
            )
          }
        ).then(() => {
          next()
        })
      } else {
        next()
      }
    }

    fileReader.onerror = function () {
      console.warn('oops, something went wrong.')
      reject(`partial ${currentChunk} of ${chunks} is fail.`)
    }

    function loadNext() {
      const start = currentChunk * chunkSize,
        end = start + chunkSize >= file.size ? file.size : start + chunkSize

      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }

    loadNext()
  })
}

export default function fileMd5(file: File): Promise<{
  chunkHashList: { hash: string }[]
}> {
  return new Promise((resolve) => {
    const blobSlice =
      File.prototype.slice ||
      (File.prototype as any).mozSlice ||
      (File.prototype as any).webkitSlice
    const chunkSize = 1048576 * 5 // Read in chunks of 5MB
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const sparkAll = new SparkMD5.ArrayBuffer()
    // 创建md5对象
    const spark = new SparkMD5.ArrayBuffer()
    // 读取文件内容
    const fileReader = new FileReader()

    const chunkInfoList: string[] = []

    fileReader.onload = function (e: ProgressEvent<FileReader>) {
      console.log('read chunk', currentChunk + 1, 'of', chunks)
      sparkAll.append(e.target?.result as ArrayBuffer) // Append array buffer
      spark.append(e.target?.result as ArrayBuffer) // Append array buffer
      const partialHash = spark.end()
      chunkInfoList.push(partialHash)

      currentChunk++

      if (currentChunk < chunks) {
        loadNext()
      } else {
        const allHash = sparkAll.end()
        console.log('finished loading')
        console.info('computed hash', allHash) // Compute hash
        fetch(`${baseUri}/upload/before`, {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            md5: allHash,
            chunkHashList: chunkInfoList,
            type: file.type,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((res) => {
          res.json().then((json) => {
            if (!json.hasUpload) {
              resolve({
                ...json,
              })
            }
          })
        })
      }
    }

    fileReader.onerror = function () {
      console.warn('oops, something went wrong.')
    }

    function loadNext() {
      const start = currentChunk * chunkSize,
        end = start + chunkSize >= file.size ? file.size : start + chunkSize

      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }

    loadNext()
  })
}
