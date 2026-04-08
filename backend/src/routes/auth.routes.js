const express = require('express');
const { loginController, verifyOTPController, saveFcmTokenController, sendLoginNotificationController, logoutController, verifyPasswordController, requestReauthOTPController, verifyReauthOTPController, refreshTokenController } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter, passwordVerifyLimiter, apiLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/login', authLimiter, loginController);

router.post('/verify-otp', otpLimiter, verifyOTPController);

router.post('/logout', authMiddleware, logoutController);

router.post('/fcm-token', authMiddleware, saveFcmTokenController);

router.post('/login-notification', authMiddleware, sendLoginNotificationController);

router.post('/verify-password', authMiddleware, passwordVerifyLimiter, verifyPasswordController);

router.post('/request-reauth-otp', authMiddleware, otpLimiter, requestReauthOTPController);

router.post('/verify-reauth-otp', authMiddleware, otpLimiter, verifyReauthOTPController);

router.post('/refresh-token', apiLimiter, refreshTokenController);

module.exports = router;
