const authService = require('../services/auth.service');

const loginController = async (req, res, next) => {
  try {
    const { phone, patientId } = req.body;

    if (!phone && !patientId) {
      return res.status(400).json({
        success: false,
        error: 'Phone or patientId is required'
      });
    }

    let normalizedPhone = null;
    let targetPatientId = null;

    if (phone) {
      normalizedPhone = phone.replace(/\D/g, '');
    }

    if (patientId) {
      targetPatientId = patientId.toUpperCase().trim();
    }

    const result = await authService.login(normalizedPhone, targetPatientId);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        error: result.error
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyOTPController = async (req, res, next) => {
  try {
    const { phone, patientId, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        error: 'OTP is required'
      });
    }

    let identifier = null;
    if (phone) {
      identifier = phone.replace(/\D/g, '');
    } else if (patientId) {
      identifier = patientId.toUpperCase().trim();
    }

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Phone or patientId is required'
      });
    }

    const result = await authService.verifyOTP(identifier, otp);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        error: result.error
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const saveFcmTokenController = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    const patientId = req.user.patientId;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'FCM token is required'
      });
    }

    const result = await authService.saveFcmToken(patientId, fcmToken);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const sendLoginNotificationController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await authService.sendLoginNotification(patientId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const logoutController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await authService.logout(patientId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyPasswordController = async (req, res, next) => {
  try {
    const { password } = req.body;
    const patientId = req.user.patientId;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const result = await authService.verifyPassword(patientId, password);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const requestReauthOTPController = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const result = await authService.requestReauthOTP(patientId);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyReauthOTPController = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const patientId = req.user.patientId;

    if (!otp) {
      return res.status(400).json({
        success: false,
        error: 'OTP is required'
      });
    }

    const result = await authService.verifyReauthOTP(patientId, otp);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const refreshTokenController = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const oldToken = authHeader.split(' ')[1];
    const result = await authService.refreshToken(oldToken);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginController,
  verifyOTPController,
  saveFcmTokenController,
  sendLoginNotificationController,
  logoutController,
  verifyPasswordController,
  requestReauthOTPController,
  verifyReauthOTPController,
  refreshTokenController
};
