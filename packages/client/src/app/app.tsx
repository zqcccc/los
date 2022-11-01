import styles from './app.module.scss'
// import NxWelcome from './nx-welcome';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useMemoizedFn } from 'ahooks'
// import { Route, Routes, Link } from 'react-router-dom';
import c from '../utils/className'
import copy from '../utils/clipboard'
import useDrag from '../hooks/drag'
import { environment } from '../environments/environment'

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
)

console.log(
  '%c environment.production: ',
  'font-size:12px;background-color: #7F2B82;color:#fff;',
  environment.production
)
const host = environment.production
  ? window.location.host
  : `${isLocalhost ? 'localhost' : window.location.hostname}:3333` // hostname has no port
const baseUri = `${window.location.protocol}//${host}`
const websocketUrl = `${
  window.location.protocol === 'https:' ? 'wss' : 'ws'
}://${host}/websockets`

const MediaLink = ({ value }: MessageType) => {
  return (
    <div>
      <a href={`${baseUri}/${value}`} target="__blank">
        {value}
      </a>
    </div>
  )
}

const NodeTypeMap: { [key: string]: React.FC<MessageType> } = {
  userText: ({ value }: MessageType) => (
    <div className={styles['text-container']}>
      <div className={styles['text-item']}>{value}</div>
      <button
        onClick={() => {
          copy(value)
        }}
      >
        copy
      </button>
    </div>
  ),
  image: ({ value }: MessageType) => (
    <div className={styles['img-container']}>
      <img src={`${baseUri}/${value}`} alt="" />
    </div>
  ),
}

const upload = (file?: File, fn?: (n: number) => void) => {
  if (file) {
    const headers: Record<string, string> = {
      'file-name': encodeURIComponent(file?.name || ''),
    }
    // browser doesn't recognize some types of files
    if (file?.name?.endsWith('.dmg')) {
      headers['Content-Type'] = 'application/octet-stream'
    }
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
        fn?.(Number(((event.loaded / event.total) * 100).toFixed(0)))
        // event.loaded returns how many bytes are downloaded
        // event.total returns the total number of bytes
        // event.total is only available if server sends `Content-Length` header
        console.log(`Uploaded ${event.loaded} of ${event.total} bytes`)
      }

      // open request
      xhr.open('POST', `${baseUri}/upload`)

      Object.entries(headers).forEach(([key, value]) =>
        xhr.setRequestHeader(key, value)
      )
      // send request
      xhr.send(file)
    })
    // return fetch(`${baseUri}/upload`, {
    //   method: 'POST',
    //   body: file,
    //   headers,
    // })
    //   .then((res) => res.text())
    //   .then(console.log)
  } else {
    return Promise.resolve()
  }
}
type MessageType = { type: string; value: string }
export function App() {
  const [list, setList] = useState<MessageType[]>([])
  const [value, setValue] = useState('')
  const websocket = useRef<WebSocket>()
  useEffect(() => {
    if (websocket.current) return
    const ws = new WebSocket(websocketUrl)
    ws.addEventListener('open', function open(e) {
      console.log('connected')
    })

    ws.addEventListener('close', function close(e) {
      console.log('disconnected')
      setTimeout(() => {
        websocket.current = undefined // will reconnect
      }, 3000)
    })

    ws.addEventListener('message', function message(e) {
      const data = JSON.parse(e.data)
      console.log(`Round-trip time: ${Date.now() - Number(data.time)} ms`)
      if (data.type === 'history') {
        setList((arr) => arr.concat(data.value))
      } else {
        setList((arr) => arr.concat(data))
      }
    })
    websocket.current = ws
    return () => console.log('Cleanup..')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websocket.current])

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    }, 0)
  }, [list])

  const sendTextHandle = () => {
    if (value) {
      websocket.current?.send(JSON.stringify({ type: 'userText', value }))
      setValue('')
    }
  }

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const handleEvent = useMemoizedFn((e: ChangeEvent<HTMLInputElement>) => {
    if (!isUploading) uploadFiles(e.target.files)
  })

  const uploadFiles = (files?: FileList | null) => {
    if (files) {
      const fileList = Array.from(files)
      if (
        fileList.some((f) => {
          return f.size / 1024 / 1024 > 50 // mb
        }) &&
        !window.confirm('Some file is more than 50mb, do you want to upload?')
      ) {
        return
      }
      // eslint-disable-next-line no-constant-condition
      setIsUploading(true)
      const uploadProgressArr = Array(files.length).fill(0)
      const promiseArr = fileList.map((file, index) =>
        upload(file, (progress) => {
          uploadProgressArr[index] = progress
          setProgress(
            Number(
              (
                uploadProgressArr.reduce((sum, cur) => sum + cur, 0) /
                files.length
              ).toFixed(0)
            )
          )
        })
      )
      Promise.all(promiseArr)
        .then((xhrs) => {
          console.log(
            '%c xhrs: ',
            'font-size:12px;background-color: #B03734;color:#fff;',
            xhrs
          )
        })
        .finally(() => {
          setIsUploading(false)
          setProgress(0)
        })
    }
  }

  const { isHighlight, dragEnterHandler, dragOutHandler, dropHandler } =
    useDrag({
      dropCallback: uploadFiles,
    })

  return (
    <>
      <div className={styles['message-list']}>
        {list.map((item, index) => {
          const Component = NodeTypeMap[item.type] || MediaLink
          return <Component key={index} {...item} />
        })}
      </div>
      <div className={styles['input-area']}>
        <div className={styles['text-input']}>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === 'Enter') sendTextHandle()
            }}
          />
          <button onClick={sendTextHandle}>send</button>
        </div>
        <div
          className={c(styles['file-input'], {
            [styles['highlight']]: isHighlight,
          })}
          onDragEnter={dragEnterHandler}
          onDragOver={dragEnterHandler}
          onDragLeave={dragOutHandler}
          onDrop={dropHandler}
        >
          <label htmlFor="upload">send a file:</label>
          <input
            type="file"
            id="upload"
            name="upload"
            onChange={handleEvent}
            multiple
          />
          {isUploading && `progress: ${progress}%`}
        </div>
      </div>
    </>
  )
}

export default App
