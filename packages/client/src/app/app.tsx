// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss'
// import NxWelcome from './nx-welcome';
import React, { useState, useEffect, useRef } from 'react'

// import { Route, Routes, Link } from 'react-router-dom';
import copy from '../utils/clipboard'

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
        <div className={styles['file-input']}>
          <label htmlFor="upload">Choose a file:</label>
          <input
            type="file"
            id="upload"
            name="upload"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file)
                fetch(`${baseUri}/upload`, {
                  method: 'POST',
                  body: file,
                  headers: {
                    'file-name': file?.name || '',
                  },
                })
                  .then((res) => res.text())
                  .then(console.log)
            }}
          />
        </div>
      </div>
    </>
  )
}

export default App
