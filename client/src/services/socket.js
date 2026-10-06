import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const socket = io(API_URL, {
  autoConnect: false,
  timeout: 10000,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  transports: ['websocket', 'polling']
});
