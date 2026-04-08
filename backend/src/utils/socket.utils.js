const { io } = require('../server');

let socketIo = null;

const getIO = () => {
  if (!socketIo && io) {
    socketIo = io;
  }
  return socketIo;
};

const emitToPatient = (patientId, event, data) => {
  try {
    const io = getIO();
    if (io) {
      io.to(`patient:${patientId}`).emit(event, data);
    }
  } catch (error) {
    console.error('Failed to emit to patient:', error);
  }
};

const createAndEmitNotification = async (prisma, patientId, notificationData) => {
  const notification = await prisma.notification.create({
    data: {
      patientId,
      ...notificationData
    }
  });

  emitToPatient(patientId, 'notification:new', {
    notification: {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt.toISOString()
    }
  });

  return notification;
};

module.exports = {
  emitToPatient,
  createAndEmitNotification
};