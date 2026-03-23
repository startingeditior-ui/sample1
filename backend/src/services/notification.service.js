const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getNotifications = async (patientId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where: { patientId } }),
    prisma.notification.count({ where: { patientId, read: false } })
  ]);

  return {
    success: true,
    data: {
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        doctorName: n.doctorName,
        hospitalName: n.hospitalName,
        read: n.read,
        createdAt: n.createdAt.toISOString()
      })),
      unreadCount,
      pagination: { page, limit, total }
    }
  };
};

const getUnreadCount = async (patientId) => {
  const count = await prisma.notification.count({
    where: { patientId, read: false }
  });

  return {
    success: true,
    data: {
      unreadCount: count
    }
  };
};

const markAsRead = async (patientId, notificationId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification || notification.patientId !== patientId) {
    return { success: false, error: 'Notification not found', statusCode: 404 };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });

  return { success: true, message: 'Notification marked as read' };
};

const markAllAsRead = async (patientId) => {
  await prisma.notification.updateMany({
    where: { patientId, read: false },
    data: { read: true }
  });

  return { success: true, message: 'All notifications marked as read' };
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
