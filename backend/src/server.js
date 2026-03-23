require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/error.handler');
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const accessRoutes = require('./routes/access.routes');
const consentRoutes = require('./routes/consent.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5002', 'http://127.0.0.1:3000'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5002;

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5002', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/access', accessRoutes);
app.use('/api/v1/consent', consentRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'medlink-patient-portal',
    timestamp: new Date().toISOString() 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-patient-room', (patientId) => {
    console.log(`Socket ${socket.id} joining room for patient: ${patientId}`);
    socket.join(`patient:${patientId}`);
  });

  socket.on('leave-patient-room', (patientId) => {
    console.log(`Socket ${socket.id} leaving room for patient: ${patientId}`);
    socket.leave(`patient:${patientId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', reason);
  });
});

const emitToPatient = (patientId, event, data) => {
  io.to(`patient:${patientId}`).emit(event, data);
};

module.exports = { app, httpServer, io, emitToPatient };

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`MedLink Patient Portal Backend running on port ${PORT}`);
  console.log(`Socket.IO server running on port ${PORT}`);
});
