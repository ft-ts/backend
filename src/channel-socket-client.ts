// socket-client.ts
import { io } from 'socket.io-client';

export function runChannelSocketClient() {
  const socket = io('http://localhost:3000/channels');

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('channelEntered', (data) => {
    const channelId = data.channelId;
    console.log('Entered channel with ID:', channelId);
    window.location.href = `/channels/${channelId}`;
  });
}
