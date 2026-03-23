const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getActiveAccess, getAccessLogs, revokeAccess, blockHospital, unblockHospital, getBlockedHospitals } = require('../controllers/access.controller');

const router = express.Router();

router.get('/active', authMiddleware, getActiveAccess);

router.get('/logs', authMiddleware, getAccessLogs);

router.post('/revoke', authMiddleware, revokeAccess);

router.post('/block-hospital', authMiddleware, blockHospital);

router.delete('/block-hospital/:hospitalId', authMiddleware, unblockHospital);

router.get('/blocked-hospitals', authMiddleware, getBlockedHospitals);

module.exports = router;
