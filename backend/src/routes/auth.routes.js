const express = require('express');
const { loginController, verifyOTPController, saveFcmTokenController, sendLoginNotificationController, logoutController, verifyPasswordController, requestReauthOTPController, verifyReauthOTPController, refreshTokenController } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', loginController);

router.post('/verify-otp', verifyOTPController);

router.post('/logout', authMiddleware, logoutController);

router.post('/fcm-token', authMiddleware, saveFcmTokenController);

router.post('/login-notification', authMiddleware, sendLoginNotificationController);

router.post('/verify-password', authMiddleware, verifyPasswordController);

router.post('/request-reauth-otp', authMiddleware, requestReauthOTPController);

router.post('/verify-reauth-otp', authMiddleware, verifyReauthOTPController);

router.post('/refresh-token', refreshTokenController);

module.exports = router;
