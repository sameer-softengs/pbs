import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const socket = io(API_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
