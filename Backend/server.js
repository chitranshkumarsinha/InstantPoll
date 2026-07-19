import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {createServer} from 'http'
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import pollRoutes from './routes/poll.js'
import redis from './redis.js';

dotenv.config();

const app = express();

// 1. Wrap Express with an HTTP Server
const server = createServer(app);

// 2. Attach Socket.io to the HTTP Server
const frontendUrl = process.env.CLIENT

const io = new Server(server, {
  cors: {
    origin: frontendUrl, 
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// 3. Middle-tier Injection: Make 'io' accessible inside our router files
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 4. WebSocket Event Orchestration
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to WebSocket: ${socket.id}`);

  // Channel clustering: Let clients join an isolated room based on the poll ID
  socket.on('join_poll', (pollId) => {
    socket.join(pollId);
    console.log(`Client attached to room: ${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected from WebSocket');
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls',pollRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Polling App API is running...');
});

const PORT = process.env.PORT || 5000;
import pool from './db.js'; // Adjust path if needed


server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});