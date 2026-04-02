import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage } from '../store/messageSlice';

class SocketService {
  private socket: Socket | null = null;
  private typingListeners: Map<string, (data: { userId: string; username: string }) => void> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on('user_typing', (data: { userId: string; username: string; channelId: string }) => {
      const listener = this.typingListeners.get(data.channelId);
      if (listener) listener(data);
    });

    this.socket.on('user_stop_typing', (data: { userId: string; channelId: string }) => {
      const listener = this.typingListeners.get(`stop:${data.channelId}`);
      if (listener) listener(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.typingListeners.clear();
    }
  }

  joinChannel(channelId: string) {
    this.socket?.emit('join_channel', channelId);
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('leave_channel', channelId);
  }

  sendMessage(data: { content: string; channelId?: string; recipientId?: string }) {
    this.socket?.emit('send_message', data);
  }

  sendTypingStart(channelId: string) {
    this.socket?.emit('typing_start', { channelId });
  }

  sendTypingStop(channelId: string) {
    this.socket?.emit('typing_stop', { channelId });
  }

  onUserTyping(channelId: string, cb: (data: { userId: string; username: string }) => void) {
    this.typingListeners.set(channelId, cb);
  }

  onUserStopTyping(channelId: string, cb: (data: { userId: string }) => void) {
    this.typingListeners.set(`stop:${channelId}`, cb);
  }

  offUserTyping(channelId: string) {
    this.typingListeners.delete(channelId);
    this.typingListeners.delete(`stop:${channelId}`);
  }
}

export default new SocketService();
