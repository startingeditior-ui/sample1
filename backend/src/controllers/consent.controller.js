const consentService = require('../services/consent.service');

const getPendingRequestsController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await consentService.getPendingRequests(patientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const sendOTPController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID is required' });
    }

    const result = await consentService.sendOTP(patientId, requestId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const approveConsentController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { requestId, otp, duration } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID is required' });
    }

    const result = await consentService.approveConsent(patientId, requestId, otp, duration);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const rejectConsentController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID is required' });
    }

    const result = await consentService.rejectConsent(patientId, requestId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const requestAccessController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { targetPatientId } = req.body;

    if (!targetPatientId) {
      return res.status(400).json({ success: false, error: 'Target patient ID is required' });
    }

    const result = await consentService.requestAccess(patientId, targetPatientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingRequests: getPendingRequestsController,
  sendOTP: sendOTPController,
  approveConsent: approveConsentController,
  rejectConsent: rejectConsentController,
  requestAccess: requestAccessController
};
