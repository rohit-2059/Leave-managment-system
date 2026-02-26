import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import { initializeFirebase } from './config/firebase.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import leaveAllocationRoutes from './routes/leaveAllocationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reimbursementRoutes from './routes/reimbursementRoutes.js';
import Message from './models/Message.js';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
initializeFirebase();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
});

// Track online users: userId -> Set<socketId>
const onlineUsers = new Map();

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.userId;

  // Track online status
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Join personal room
  socket.join(`user_${userId}`);

  // Broadcast online status & send current online list
  io.emit('user_online', { userId });
  socket.emit('online_users', Array.from(onlineUsers.keys()));

  // Send initial unread count
  Message.countDocuments({ receiverId: userId, read: false })
    .then((count) => socket.emit('unread_count', count))
    .catch(() => {});

  // Handle sending a message via socket
  socket.on('send_message', async (data, callback) => {
    try {
      const message = await Message.create({
        senderId: userId,
        receiverId: data.receiverId,
        content: data.content.trim(),
      });
      const populated = await Message.findById(message._id)
        .populate('senderId', 'name email avatar role')
        .populate('receiverId', 'name email avatar role');

      // Deliver to receiver in real-time
      io.to(`user_${data.receiverId}`).emit('receive_message', populated);

      // Update receiver's unread count
      const receiverUnread = await Message.countDocuments({ receiverId: data.receiverId, read: false });
      io.to(`user_${data.receiverId}`).emit('unread_count', receiverUnread);

      if (callback) callback({ success: true, message: populated });
    } catch (err) {
      if (callback) callback({ success: false, error: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    io.to(`user_${data.receiverId}`).emit('user_typing', { userId, isTyping: data.isTyping });
  });

  // Mark messages as read
  socket.on('mark_read', async (data) => {
    try {
      await Message.updateMany(
        { senderId: data.senderId, receiverId: userId, read: false },
        { read: true }
      );
      // Send updated unread count to this user
      const count = await Message.countDocuments({ receiverId: userId, read: false });
      socket.emit('unread_count', count);
      // Notify sender their messages were read
      io.to(`user_${data.senderId}`).emit('messages_read', { readBy: userId });
    } catch {
      // silently fail
    }
  });

  // Unread count request
  socket.on('get_unread_count', async () => {
    try {
      const count = await Message.countDocuments({ receiverId: userId, read: false });
      socket.emit('unread_count', count);
    } catch {
      // silently fail
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        io.emit('user_offline', { userId });
      }
    }
  });
});

// Make io accessible to REST routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leave-allocations', leaveAllocationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reimbursements', reimbursementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Leave Management System API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Connect to DB and start server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`Socket.IO ready`);
  });
});
