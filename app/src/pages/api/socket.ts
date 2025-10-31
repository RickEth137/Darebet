import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket.io already running');
    res.end();
    return;
  }

  console.log('Initializing Socket.io server...');
  const httpServer: NetServer = res.socket.server as any;
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store online users per dare
  const onlineUsers = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a dare's chat room
    socket.on('join-dare', ({ dareId, userId, username }) => {
      socket.join(`dare-${dareId}`);
      
      // Track online user
      if (!onlineUsers.has(dareId)) {
        onlineUsers.set(dareId, new Set());
      }
      onlineUsers.get(dareId)?.add(userId);

      // Notify others user joined
      io.to(`dare-${dareId}`).emit('user-joined', {
        userId,
        username,
        onlineCount: onlineUsers.get(dareId)?.size || 0,
      });

      console.log(`User ${username} joined dare-${dareId}`);
    });

    // Leave dare chat room
    socket.on('leave-dare', ({ dareId, userId }) => {
      socket.leave(`dare-${dareId}`);
      onlineUsers.get(dareId)?.delete(userId);

      io.to(`dare-${dareId}`).emit('user-left', {
        userId,
        onlineCount: onlineUsers.get(dareId)?.size || 0,
      });

      console.log(`User ${userId} left dare-${dareId}`);
    });

    // Send message to dare room
    socket.on('send-message', ({ dareId, message }) => {
      console.log(`Message in dare-${dareId}:`, message);
      
      // Broadcast to everyone in the room including sender
      io.to(`dare-${dareId}`).emit('new-message', message);
    });

    // Typing indicator
    socket.on('typing', ({ dareId, userId, username }) => {
      socket.to(`dare-${dareId}`).emit('user-typing', { userId, username });
    });

    socket.on('stop-typing', ({ dareId, userId }) => {
      socket.to(`dare-${dareId}`).emit('user-stop-typing', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up online users (we'd need to track socket-to-user mapping for this)
      // For now, users will be removed when they explicitly leave
    });
  });

  res.socket.server.io = io;
  console.log('Socket.io server initialized successfully');
  res.end();
};

export default SocketHandler;
