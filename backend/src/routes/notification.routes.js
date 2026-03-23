const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', authMiddleware, getNotifications);

router.get('/unread-count', authMiddleware, getUnreadCount);

router.put('/:notificationId/read', authMiddleware, markAsRead);

router.put('/read-all', authMiddleware, markAllAsRead);

module.exports = router;
