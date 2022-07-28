// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss';
import NxWelcome from './nx-welcome';
import { useState, useEffect, useRef } from 'react';

import { Route, Routes, Link } from 'react-router-dom';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

const host = `${isLocalhost ? 'localhost' : location.hostname}:3333`;
const baseUri = `${location.protocol}//${host}`;

const NodeTypeMap = {
  text: ({ value }: MessageType) => <div>{value}</div>,
  image: ({ value }: MessageType) => (
    <div className={styles['img-container']}>
      <img src={`${baseUri}/${value}`} />
    </div>
  ),
};

type MessageType = { type: 'text' | 'image'; value: any };
export function App() {
  const [list, setList] = useState<MessageType[]>([]);
  const [value, setValue] = useState('');
  const websocket = useRef<WebSocket>();
  useEffect(() => {
    if (websocket.current) return;
    const ws = new WebSocket(`ws://${host}/websockets`);
    ws.addEventListener('open', function open(e) {
      console.log('connected');
    });

    ws.addEventListener('close', function close(e) {
      console.log('disconnected');
    });

    ws.addEventListener('message', function message(e) {
      const data = JSON.parse(e.data);
      console.log(`Round-trip time: ${Date.now() - Number(data.time)} ms`);
      if (data.type === 'history') {
        setList((arr) => arr.concat(data.value));
      } else {
        setList((arr) => arr.concat(data));
      }
    });
    websocket.current = ws;
    return () => console.log('Cleanup..');
  }, []);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    }, 0)
  }, [list])

  const sendTextHandle = () => {
    // fetch(`${location.protocol}//${url}/abc`, { method: 'POST' });
    if (value) {
      websocket.current?.send(JSON.stringify({ type: 'text', value }));
      setValue('');
    }
  };
  return (
    <>
      <div className={styles['message-list']}>
        {list.map((item, index) => {
          const Component = NodeTypeMap[item.type];
          return <Component key={index} {...item} />;
        })}
      </div>
      <div className={styles['input-area']}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') sendTextHandle();
          }}
        />
        <button onClick={sendTextHandle}>send</button>
        <div>
          <label htmlFor="avatar">Choose a file:</label>
          <input
            type="file"
            id="avatar"
            name="avatar"
            accept="image/png, image/jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                fetch(`${baseUri}/upload`, {
                  method: 'POST',
                  body: file,
                  headers: {
                    'file-name': file?.name || '',
                  },
                })
                  .then((res) => res.text())
                  .then(console.log);
            }}
          />
        </div>
      </div>
    </>
  );
}

export default App;
