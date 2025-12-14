import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupSocketIO = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.username} connected with socket ID: ${socket.id}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining channels
    socket.on('join_channel', (channelId: string) => {
      socket.join(`channel:${channelId}`);
      console.log(`User ${socket.username} joined channel: ${channelId}`);
    });

    // Handle leaving channels
    socket.on('leave_channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.username} left channel: ${channelId}`);
    });

    // Handle new messages
    socket.on('send_message', (data) => {
      // Broadcast to channel or direct message recipient
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('new_message', {
          ...data,
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
      } else if (data.recipientId) {
        socket.to(`user:${data.recipientId}`).emit('new_message', {
          ...data,
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          channelId: data.channelId
        });
      }
    });

    socket.on('typing_stop', (data) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('user_stop_typing', {
          userId: socket.userId,
          channelId: data.channelId
        });
      }
    });

    // Handle user presence
    socket.on('user_online', () => {
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'online'
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.username} disconnected`);
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline'
      });
    });
  });
};