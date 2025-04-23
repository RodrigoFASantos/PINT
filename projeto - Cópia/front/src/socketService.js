import { io } from 'socket.io-client';
import API_BASE from './api';

let socket = null;

// Função para inicializar a conexão do Socket.IO
export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_BASE, {
    query: { token },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('Socket.IO conectado com sucesso');
  });

  socket.on('connect_error', (error) => {
    console.error('Erro de conexão Socket.IO:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket.IO desconectado: ${reason}`);
  });

  return socket;
};

// Obter a instância do Socket.IO
export const getSocket = () => {
  return socket;
};

// Entrar em um tópico
export const joinTopic = (topicoId) => {
  if (socket && socket.connected) {
    socket.emit('joinTopic', topicoId);
  }
};

// Sair de um tópico
export const leaveTopic = (topicoId) => {
  if (socket && socket.connected) {
    socket.emit('leaveTopic', topicoId);
  }
};

// Desconectar o Socket.IO
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  joinTopic,
  leaveTopic,
  disconnectSocket
};