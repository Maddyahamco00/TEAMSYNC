import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

interface MessageData {
  content: string;
  channelId?: string;
  recipientId?: string;
  parentMessageId?: string;
}

const extractMentions = (content: string): string[] => {
  const matches = content.match(/@(\w+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
};

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
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.username} connected`);

    socket.join(`user:${socket.userId}`);

    // Mark user online
    prisma.user.update({
      where: { id: socket.userId! },
      data: { status: 'online' }
    }).catch(console.error);

    // Join user's channels
    prisma.channelMember.findMany({
      where: { userId: socket.userId! },
      select: { channelId: true }
    }).then(memberships => {
      memberships.forEach(membership => {
        socket.join(`channel:${membership.channelId}`);
      });
    }).catch(console.error);

    // Handle sending messages
    socket.on('sendMessage', async (data: MessageData) => {
      if (!isValidMessageData(data)) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      try {
        if (data.channelId) {
          // Check if user has access to channel
          const channelMember = await prisma.channelMember.findFirst({
            where: {
              channelId: data.channelId,
              userId: socket.userId!
            }
          });

          if (!channelMember) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Create message
          const message = await prisma.message.create({
            data: {
              content: data.content,
              userId: socket.userId!,
              username: socket.username!,
              channelId: data.channelId
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true
                }
              }
            }
          });

          // Handle mentions
          const mentions = extractMentions(data.content);
          if (mentions.length > 0) {
            const mentionedUsers = await prisma.user.findMany({
              where: {
                username: { in: mentions }
              },
              select: { id: true, username: true }
            });

            for (const user of mentionedUsers) {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  type: 'MENTION',
                  messageId: message.id,
                  channelId: data.channelId,
                  fromUsername: socket.username!,
                  content: data.content
                }
              });

              // Emit notification to mentioned user
              io.to(`user:${user.id}`).emit('notification', {
                id: message.id,
                type: 'mention',
                fromUsername: socket.username!,
                channelId: data.channelId,
                content: data.content,
                createdAt: message.createdAt
              });
            }
          }

          // Broadcast message to channel
          io.to(`channel:${data.channelId}`).emit('message', message);

        } else if (data.recipientId) {
          // Direct message (not implemented yet)
          socket.emit('error', { message: 'Direct messages not implemented yet' });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { channelId: string; isTyping: boolean }) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('userTyping', {
          userId: socket.userId,
          username: socket.username,
          isTyping: data.isTyping
        });
      }
    });

    // Handle joining channels
    socket.on('joinChannel', async (channelId: string) => {
      try {
        const membership = await prisma.channelMember.findFirst({
          where: {
            channelId,
            userId: socket.userId!
          }
        });

        if (membership) {
          socket.join(`channel:${channelId}`);
          socket.emit('joinedChannel', { channelId });
        } else {
          socket.emit('error', { message: 'Access denied to channel' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Handle leaving channels
    socket.on('leaveChannel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.emit('leftChannel', { channelId });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.username} disconnected`);

      // Mark user offline after a delay (to handle page refreshes)
      setTimeout(async () => {
        try {
          // Check if user is still connected on any socket
          const connectedSockets = await io.fetchSockets();
          const userStillConnected = connectedSockets.some(s =>
            (s as AuthenticatedSocket).userId === socket.userId
          );

          if (!userStillConnected) {
            await prisma.user.update({
              where: { id: socket.userId! },
              data: { status: 'offline' }
            });

            // Broadcast offline status
            io.emit('userStatus', {
              userId: socket.userId,
              status: 'offline'
            });
          }
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      }, 5000); // 5 second delay
    });
  });
};