// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss'
// import NxWelcome from './nx-welcome';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useMemoizedFn } from 'ahooks'
// import { Route, Routes, Link } from 'react-router-dom';
import c from '../utils/className'
import copy from '../utils/clipboard'
import useDrag from '../hooks/drag'

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
)

const host = `${isLocalhost ? 'localhost' : window.location.hostname}:3333`
const baseUri = `${window.location.protocol}//${host}`

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

const upload = (file?: File) => {
  if (file) {
    const headers: Record<string, string> = {
      'file-name': file?.name || '',
    }
    // browser doesn't recognize some types of files
    if(file?.name?.endsWith('.dmg')) {
      headers['Content-Type'] = 'application/octet-stream'
    }
    fetch(`${baseUri}/upload`, {
      method: 'POST',
      body: file,
      headers,
    })
      .then((res) => res.text())
      .then(console.log)
  }
}
type MessageType = { type: string; value: string }
export function App() {
  const [list, setList] = useState<MessageType[]>([])
  const [value, setValue] = useState('')
  const websocket = useRef<WebSocket>()
  useEffect(() => {
    if (websocket.current) return
    const ws = new WebSocket(`ws://${host}/websockets`)
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

  const handleEvent = useMemoizedFn((e: ChangeEvent<HTMLInputElement>) => {
    uploadFiles(e.target.files)
  })

  const uploadFiles = (files?: FileList | null) => {
    if (files) Array.from(files).forEach(upload)
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
          <label htmlFor="upload">Choose a file:</label>
          <input type="file" id="upload" name="upload" onChange={handleEvent} />
        </div>
      </div>
    </>
  )
}

export default App
