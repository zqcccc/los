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

export function App() {
  const [list, setList] = useState<{ value: any }[]>([]);
  const [value, setValue] = useState('');
  const websocket = useRef<WebSocket>();
  useEffect(() => {
    if (websocket.current) return;
    const ws = new WebSocket(
      `ws://${`${
        isLocalhost ? 'localhost' : location.hostname
      }:3333`}/websockets`
    );
    ws.addEventListener('open', function open(e) {
      console.log('connected');
    });

    ws.addEventListener('close', function close(e) {
      console.log('disconnected');
    });

    ws.addEventListener('message', function message(e) {
      const data = JSON.parse(e.data);
      console.log(`Round-trip time: ${Date.now() - Number(data.time)} ms`);
      setList((arr) => arr.concat(data));
    });
    websocket.current = ws;
    return () => console.log('Cleanup..');
  }, []);
  return (
    <>
      {list.map((item, index) => {
        return <div key={index}>{item?.value?.toString()}</div>;
      })}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        onClick={() => {
          websocket.current?.send(JSON.stringify({ type: 'text', value }));
        }}
      >
        send
      </button>
    </>
  );
}

export default App;
