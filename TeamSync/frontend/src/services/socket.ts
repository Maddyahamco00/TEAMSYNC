import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage } from '../store/messageSlice';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChannel(channelId: string) {
    if (this.socket) {
      this.socket.emit('join_channel', channelId);
    }
  }

  leaveChannel(channelId: string) {
    if (this.socket) {
      this.socket.emit('leave_channel', channelId);
    }
  }

  sendMessage(data: { content: string; channelId?: string; recipientId?: string }) {
    if (this.socket) {
      this.socket.emit('send_message', data);
    }
  }
}

export default new SocketService();