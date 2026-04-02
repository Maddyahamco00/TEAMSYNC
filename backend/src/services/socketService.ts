import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { messages, channels, generateId } from '../store/memoryStore';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

interface MessageData {
  content: string;
  channelId?: string;
  recipientId?: string;
}

const isValidMessageData = (data: any): data is MessageData =>
  data &&
  typeof data.content === 'string' &&
  data.content.trim().length > 0 &&
  data.content.length <= 4000 &&
  (typeof data.channelId === 'string' || typeof data.recipientId === 'string');

export const setupSocketIO = (io: Server) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, secret) as any;
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('join_channel', (channelId: string) => {
      if (typeof channelId === 'string') socket.join(`channel:${channelId}`);
    });

    socket.on('leave_channel', (channelId: string) => {
      if (typeof channelId === 'string') socket.leave(`channel:${channelId}`);
    });

    socket.on('send_message', (data: unknown) => {
      if (!isValidMessageData(data)) return;

      if (data.channelId) {
        const channel = channels.find(c => c.id === data.channelId);
        if (!channel || !channel.members.includes(socket.userId!)) return;

        const message = {
          id: generateId(),
          content: data.content.trim(),
          userId: socket.userId!,
          username: socket.username!,
          channelId: data.channelId,
          edited: false,
          createdAt: new Date(),
        };
        messages.push(message);

        // Emit to all channel members including sender
        io.to(`channel:${data.channelId}`).emit('new_message', message);
      } else if (data.recipientId) {
        const message = {
          id: generateId(),
          content: data.content.trim(),
          userId: socket.userId!,
          username: socket.username!,
          channelId: data.recipientId,
          edited: false,
          createdAt: new Date(),
        };
        messages.push(message);

        socket.to(`user:${data.recipientId}`).emit('new_message', message);
        socket.emit('new_message', message);
      }
    });

    socket.on('typing_start', (data: { channelId?: string }) => {
      if (typeof data?.channelId === 'string') {
        socket.to(`channel:${data.channelId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          channelId: data.channelId
        });
      }
    });

    socket.on('typing_stop', (data: { channelId?: string }) => {
      if (typeof data?.channelId === 'string') {
        socket.to(`channel:${data.channelId}`).emit('user_stop_typing', {
          userId: socket.userId,
          channelId: data.channelId
        });
      }
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline'
      });
    });
  });
};
