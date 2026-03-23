const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getPendingRequests, sendOTP, approveConsent, rejectConsent, requestAccess } = require('../controllers/consent.controller');

const router = express.Router();

router.get('/pending', authMiddleware, getPendingRequests);

router.post('/send-otp', authMiddleware, sendOTP);

router.post('/approve', authMiddleware, approveConsent);

router.post('/reject', authMiddleware, rejectConsent);

router.post('/request', authMiddleware, requestAccess);

module.exports = router;
