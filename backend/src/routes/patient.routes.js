const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { otpLimiter, apiLimiter } = require('../middleware/rateLimiter.middleware');
const {
  getProfile,
  updateProfile,
  getInsurance,
  updateInsurance,
  getEmergencyData,
  listRecords,
  getRecord,
  addRecord,
  updateRecord,
  deleteRecord,
  getRecordTypes,
  generateOTP,
  getOTPStatus,
  revokeOTP,
  listAuditLogs,
  getQR,
  setPasswordController
} = require('../controllers/patient.controller');

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);

router.put('/profile', authMiddleware, updateProfile);

router.get('/insurance', authMiddleware, getInsurance);

router.put('/insurance', authMiddleware, updateInsurance);

router.get('/emergency-data', authMiddleware, getEmergencyData);

router.get('/records', authMiddleware, listRecords);

router.get('/records/types', authMiddleware, getRecordTypes);

router.get('/records/:recordId', authMiddleware, getRecord);

router.post('/records', authMiddleware, addRecord);

router.put('/records/:recordId', authMiddleware, updateRecord);

router.delete('/records/:recordId', authMiddleware, deleteRecord);

router.post('/otp/generate', authMiddleware, otpLimiter, generateOTP);

router.get('/otp/status', authMiddleware, getOTPStatus);

router.post('/otp/revoke', authMiddleware, revokeOTP);

router.get('/audit-log', authMiddleware, listAuditLogs);

router.get('/qr', authMiddleware, getQR);

router.post('/set-password', authMiddleware, setPasswordController);

module.exports = router;
