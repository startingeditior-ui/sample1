const {
  getPatientProfile,
  updatePatientProfile,
  getPatientInsurance,
  updatePatientInsurance,
  getEmergencyData,
  getRecordTypes,
  getMedicalRecords,
  getMedicalRecordById,
  addPatientRecord,
  updatePatientRecord,
  deletePatientRecord,
  generateShareOTP,
  getOTPStatus,
  revokeOTPSession,
  getAuditLog,
  getQRData,
  setPassword,
  getInsuranceAvailments,
  addInsuranceAvailment,
  getInsuranceSummary
} = require('../services/patient.service');

const getProfile = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getPatientProfile(patientId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await updatePatientProfile(patientId, req.body);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getEmergencyDataController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getEmergencyData(patientId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRecordTypesController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getRecordTypes(patientId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const listRecords = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { search, typeId } = req.query;
    const result = await getMedicalRecords(patientId, search, typeId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRecord = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { recordId } = req.params;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'Record ID is required'
      });
    }

    const result = await getMedicalRecordById(patientId, recordId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const addRecord = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await addPatientRecord(patientId, req.body);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { recordId } = req.params;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'Record ID is required'
      });
    }

    const result = await updatePatientRecord(patientId, recordId, req.body);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteRecord = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { recordId } = req.params;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'Record ID is required'
      });
    }

    const result = await deletePatientRecord(patientId, recordId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const generateOTP = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await generateShareOTP(patientId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getOTPStatusController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getOTPStatus(patientId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const revokeOTP = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await revokeOTPSession(patientId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getAuditLog(patientId, page, limit);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getQR = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getQRData(patientId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const setPasswordController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const result = await setPassword(patientId, password);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getInsurance = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getPatientInsurance(patientId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateInsurance = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await updatePatientInsurance(patientId, req.body);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getInsuranceAvailmentsController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getInsuranceAvailments(patientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const addInsuranceAvailmentController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { hospitalId, hospitalName, amountAvailed, dateOfAvailment, reason } = req.body;

    if (!amountAvailed || !dateOfAvailment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount and date are required' 
      });
    }

    const result = await addInsuranceAvailment(patientId, {
      hospitalId,
      hospitalName,
      amountAvailed,
      dateOfAvailment,
      reason
    });

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getInsuranceSummaryController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await getInsuranceSummary(patientId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getInsurance,
  updateInsurance,
  getEmergencyData: getEmergencyDataController,
  getRecordTypes: getRecordTypesController,
  listRecords,
  getRecord,
  addRecord,
  updateRecord,
  deleteRecord,
  generateOTP,
  getOTPStatus: getOTPStatusController,
  revokeOTP,
  listAuditLogs,
  getQR,
  setPasswordController,
  getInsuranceAvailments: getInsuranceAvailmentsController,
  addInsuranceAvailment: addInsuranceAvailmentController,
  getInsuranceSummary: getInsuranceSummaryController
};
