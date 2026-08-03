const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Join user's personal room for notifications
    socket.join(socket.user.id);
    
    // Join match rooms
    socket.on('join_match', (matchId) => {
      socket.join(matchId);
      console.log(`User ${socket.user.id} joined match ${matchId}`);
    });
    
    // Leave match room
    socket.on('leave_match', (matchId) => {
      socket.leave(matchId);
      console.log(`User ${socket.user.id} left match ${matchId}`);
    });
    
    // Handle typing indicator
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(matchId).emit('user_typing', {
        userId: socket.user.id,
        isTyping
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
  
  return io;
};

module.exports = setupSocket;