import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const socketUrl = apiUrl.replace(/\/api$/, '');

export function useSocket(cafeId, eventListeners) {
  const socketRef = useRef(null);
  const listenersRef = useRef(eventListeners);

  useEffect(() => {
    listenersRef.current = eventListeners;
  }, [eventListeners]);

  useEffect(() => {
    if (!cafeId) return;

    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server:', socket.id);
      socket.emit('join_cafe', cafeId);
    });

    const events = Object.keys(eventListeners);
    events.forEach((event) => {
      socket.on(event, (data) => {
        if (listenersRef.current[event]) {
          listenersRef.current[event](data);
        }
      });
    });

    return () => {
      socket.emit('leave_cafe', cafeId);
      socket.disconnect();
      console.log('Disconnected from socket server');
    };
  }, [cafeId]);

  return socketRef.current;
}
