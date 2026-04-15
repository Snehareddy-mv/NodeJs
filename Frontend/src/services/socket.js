import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChannel(channelId) {
    console.log('Joining channel:', channelId);
    this.socket?.emit('channel:join', channelId);
  }

  leaveChannel(channelId) {
    this.socket?.emit('channel:leave', channelId);
  }

  sendMessage(data) {
    console.log('Sending message via Socket.io:', data);
    this.socket?.emit('message:send', data);
  }

  editMessage(messageId, content) {
    this.socket?.emit('message:edit', { messageId, content });
  }

  pinMessage(messageId) {
    this.socket?.emit('message:pin', messageId);
  }

  unpinMessage(messageId) {
    this.socket?.emit('message:unpin', messageId);
  }

  startTyping(data) {
    this.socket?.emit('typing:start', data);
  }

  stopTyping(data) {
    this.socket?.emit('typing:stop', data);
  }

  deleteMessage(messageId) {
    this.socket?.emit('message:delete', messageId);
  }

  onNewMessage(callback) {
    this.socket?.on('message:new', callback);
  }

  onMessageEdited(callback) {
    this.socket?.on('message:edited', callback);
  }

  onMessagePinned(callback) {
    this.socket?.on('message:pinned', callback);
  }

  onMessageUnpinned(callback) {
    this.socket?.on('message:unpinned', callback);
  }

  onMessageDeleted(callback) {
    this.socket?.on('message:deleted', callback);
  }

  onUserOnline(callback) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback) {
    this.socket?.on('user:offline', callback);
  }

  onUserJoined(callback) {
    this.socket?.on('user:joined', callback);
  }

  onUserLeft(callback) {
    this.socket?.on('user:left', callback);
  }

  onTypingStart(callback) {
    this.socket?.on('typing:start', callback);
  }

  onTypingStop(callback) {
    this.socket?.on('typing:stop', callback);
  }

  off(event) {
    this.socket?.off(event);
  }
}

export default new SocketService();
