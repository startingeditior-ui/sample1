const accessService = require('../services/access.service');

const getActiveAccessController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await accessService.getActiveAccess(patientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAccessLogsController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await accessService.getAccessLogs(patientId, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const revokeAccessController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { accessId } = req.body;

    if (!accessId) {
      return res.status(400).json({ success: false, error: 'Access ID is required' });
    }

    const result = await accessService.revokeAccess(patientId, accessId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const blockHospitalController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { hospitalId } = req.body;

    if (!hospitalId) {
      return res.status(400).json({ success: false, error: 'Hospital ID is required' });
    }

    const result = await accessService.blockHospital(patientId, hospitalId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const unblockHospitalController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { hospitalId } = req.params;

    const result = await accessService.unblockHospital(patientId, hospitalId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getBlockedHospitalsController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await accessService.getBlockedHospitals(patientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveAccess: getActiveAccessController,
  getAccessLogs: getAccessLogsController,
  revokeAccess: revokeAccessController,
  blockHospital: blockHospitalController,
  unblockHospital: unblockHospitalController,
  getBlockedHospitals: getBlockedHospitalsController
};
