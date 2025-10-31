const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store online users per dare
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a dare's chat room
    socket.on('join-dare', ({ dareId, userId, username }) => {
      socket.join(`dare-${dareId}`);
      
      // Track online user
      if (!onlineUsers.has(dareId)) {
        onlineUsers.set(dareId, new Set());
      }
      onlineUsers.get(dareId).add(userId);

      // Notify others user joined
      io.to(`dare-${dareId}`).emit('user-joined', {
        userId,
        username,
        onlineCount: onlineUsers.get(dareId).size,
      });

      console.log(`User ${username} joined dare-${dareId}`);
    });

    // Leave dare chat room
    socket.on('leave-dare', ({ dareId, userId }) => {
      socket.leave(`dare-${dareId}`);
      if (onlineUsers.has(dareId)) {
        onlineUsers.get(dareId).delete(userId);
      }

      io.to(`dare-${dareId}`).emit('user-left', {
        userId,
        onlineCount: onlineUsers.get(dareId)?.size || 0,
      });

      console.log(`User ${userId} left dare-${dareId}`);
    });

    // Send message to dare room
    socket.on('send-message', ({ dareId, message }) => {
      console.log(`Message in dare-${dareId}:`, message);
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
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> Socket.io server initialized');
  });
});
