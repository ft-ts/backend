import { io } from 'socket.io-client';

export function runChannelSocketClient() {
  const socket = io('http://localhost:3000/channels');

  socket.on('connect', () => {
    console.log('Connected to server');

  });

  socket.on('channelEntered', (data) => {
    const channelId = data.channelId;

    window.location.href = `/channels/${channelId}`;
  });

  socket.on('getAllChannels', (data) => {
    console.log('All channels:', data);
  });

  socket.on('getMyChannels', (data) => {
    console.log('My channels:', data);
  });

  socket.on('newMessage', (data) => {
    console.log('Message received:', data);
  }
  );

  socket.on('editChannel', (data) => {
    console.log('Channel edited:', data);
  });
  

}
