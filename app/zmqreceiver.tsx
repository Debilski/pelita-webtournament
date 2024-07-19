'use client'

import React, { useEffect, useState } from 'react';
import * as zmq from 'jszmq';

interface GameState {
  game_uuid: string;
  shape: [number, number];
  walls: [number, number][];
  food: [number, number][];
  bots: [number, number][];
  team_names: [string, string];
}

export type { GameState };

const ZMQReceiver = ({ url, sendGameState, sendMessage, sendClearPage }: { url: string,
  sendGameState: (gs: {"__data__": GameState}) => any,
  sendMessage: (msg: string) => any,
  sendClearPage: () => any
 }

) => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    console.log('hi');
    const socket = zmq.socket('sub');
    socket.options.reconnectInterval = 1000;
    socket.connect(url);
    socket.subscribe('');

    socket.on('message', (message) => {
      setMessages((prevMessages) => [/*...prevMessages, */message.toString()]);
      let parsed = JSON.parse(message);
      console.log(parsed);
      if (parsed['__action__'] && parsed['__action__'] === 'SPEAK') {
        sendMessage(parsed['__data__']);
      } else if (parsed['__action__'] && parsed['__action__'] === 'CLEAR') {
        sendClearPage();
      } else {
        sendGameState(parsed);
      }
    });

    return () => {
      socket.unsubscribe('');
      socket.close();
    };
  }, [url]);

  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800 dark:border-gray-600">
      <h2 className='text-xs text-slate-300'>ZeroMQ Messages:</h2>
      <ul>
        {messages.map((message, index) => (
          <li key={index} className='text-xs text-slate-300' style={{fontSize: 0.45 + 'rem', lineHeight: 0.5 + 'rem'}}>{message}</li>
        ))}
      </ul>
    </footer>
  );
};

export default ZMQReceiver;
