const notificationService = require('../services/notification.service');

const getNotificationsController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await notificationService.getNotifications(patientId, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUnreadCountController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await notificationService.getUnreadCount(patientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const markAsReadController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ success: false, error: 'Notification ID is required' });
    }

    const result = await notificationService.markAsRead(patientId, notificationId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const markAllAsReadController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await notificationService.markAllAsRead(patientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications: getNotificationsController,
  getUnreadCount: getUnreadCountController,
  markAsRead: markAsReadController,
  markAllAsRead: markAllAsReadController
};
