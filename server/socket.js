const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    next(new Error('Authentication error: Invalid token'));
  }
};

const setupSocket = (server) => {
  const allowedOrigins = process.env.CLIENT_URL 
    ? [process.env.CLIENT_URL] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000 // 25 seconds
  });

  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);
    
    // Join user's personal room for notifications
    socket.join(userId);
    
    // Track active connections per user
    socket.on('register_user', (data) => {
      socket.join(`user_${data.userId}`);
    });

    // Join match room
    socket.on('join_match', (matchId) => {
      socket.join(matchId.toString());
      console.log(`User ${userId} joined match ${matchId}`);
    });
    
    // Leave match room
    socket.on('leave_match', (matchId) => {
      socket.leave(matchId.toString());
      console.log(`User ${userId} left match ${matchId}`);
    });
    
    // Handle typing indicator with debounce support
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(matchId.toString()).emit('user_typing', {
        userId: userId,
        isTyping,
        matchId
      });
    });
    
    // Handle message delivery acknowledgment
    socket.on('message_delivered', ({ messageId, matchId }) => {
      socket.to(matchId.toString()).emit('message_delivered', {
        messageId,
        deliveredBy: userId
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${userId}, reason: ${reason}`);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });
  
  return io;
};

module.exports = setupSocket;