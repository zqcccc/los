import { baseUri } from './uri'

export const uploadFile = (
  file: File,
  url = `${baseUri}/upload`,
  headers?: Record<string, string>,
  progressHandle?: (n: number) => void
) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    // listen for `upload.load` event
    xhr.upload.onload = () => {
      resolve(xhr)
      console.log(`The upload is completed: ${xhr.status} ${xhr.response}`)
    }

    // listen for `upload.error` event
    xhr.upload.onerror = (e) => {
      console.error('Upload failed.')
      reject(e)
    }

    // listen for `upload.abort` event
    xhr.upload.onabort = (e) => {
      console.error('Upload cancelled.')
      reject(e)
    }

    // listen for `progress` event
    xhr.upload.onprogress = (event) => {
      progressHandle?.(Number(((event.loaded / event.total) * 100).toFixed(0)))
      // event.loaded returns how many bytes are downloaded
      // event.total returns the total number of bytes
      // event.total is only available if server sends `Content-Length` header
      console.log(`Uploaded ${event.loaded} of ${event.total} bytes`)
    }

    // open request
    xhr.open('POST', url)

    headers &&
      Object.entries(headers).forEach(([key, value]) =>
        xhr.setRequestHeader(key, value)
      )
    // send request
    xhr.send(file)
  })
}
