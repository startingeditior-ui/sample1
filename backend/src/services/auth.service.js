const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, hashOTP, verifyOTP: verifyOTPUtil, getOTPExpiry } = require('../utils/otp.utils');
const { sendOTP } = require('../services/sms.service');
const { createAndEmitNotification } = require('../utils/socket.utils');

const prisma = new PrismaClient();

const MAX_FAILED_ATTEMPTS = 5;

const login = async (phone, patientId) => {
  let user = null;
  
  if (phone) {
    user = await prisma.user.findFirst({
      where: {
        phone,
        role: 'PATIENT'
      },
      include: {
        patient: true
      }
    });
  } else if (patientId) {
    const patient = await prisma.patient.findUnique({
      where: { patientCode: patientId },
      include: {
        user: true
      }
    });
    if (patient && patient.user) {
      user = { ...patient.user, patient };
    }
  }

  if (!user) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  if (!user.isActive) {
    return { success: false, error: 'Account not activated', statusCode: 403 };
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = getOTPExpiry();

  await prisma.verificationOTP.create({
    data: {
      target: phone || patientId,
      type: phone ? 'PHONE' : 'EMAIL',
      otpHash,
      expiresAt,
      patientId: user.patient.id
    }
  });

  if (phone) {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    await sendOTP(formattedPhone, otp);
  } else {
    console.log(`OTP for ${patientId}: ${otp}`);
  }

  return {
    success: true,
    message: 'OTP sent successfully'
  };
};

const verifyOTP = async (identifier, otp) => {
  const isPhone = /^\d{10,}$/.test(identifier);
  const type = isPhone ? 'PHONE' : 'EMAIL';

  const otpRecord = await prisma.verificationOTP.findFirst({
    where: {
      target: identifier,
      type,
      verified: false
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord) {
    return { success: false, error: 'OTP not found or already used', statusCode: 404 };
  }

  if (new Date() > otpRecord.expiresAt) {
    return { success: false, error: 'OTP expired', statusCode: 400 };
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    return { success: false, error: 'Too many failed attempts', statusCode: 400 };
  }

  const isValid = verifyOTPUtil(otp, otpRecord.otpHash);

  if (!isValid) {
    await prisma.verificationOTP.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } }
    });
    return { success: false, error: 'Invalid OTP', statusCode: 401 };
  }

  await prisma.verificationOTP.update({
    where: { id: otpRecord.id },
    data: { verified: true }
  });

  const patient = await prisma.patient.findUnique({
    where: { id: otpRecord.patientId },
    include: {
      user: true
    }
  });

  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  await prisma.user.update({
    where: { id: patient.userId },
    data: {
      failedLoginAttempts: 0,
      lastLogin: new Date()
    }
  });

  const token = jwt.sign(
    {
      userId: patient.userId,
      patientId: patient.id,
      role: 'PATIENT'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  await createAuditLog({
    patientId: patient.id,
    action: 'PATIENT_LOGIN',
    description: 'Patient logged in successfully via OTP'
  });

  return {
    success: true,
    token,
    patient: {
      id: patient.id,
      patientId: patient.patientCode,
      name: patient.name,
      photoUrl: patient.photoUrl
    }
  };
};

const saveFcmToken = async (patientId, fcmToken) => {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { fcmToken }
    });

    return { success: true, message: 'FCM token saved' };
  } catch (error) {
    console.error('Failed to save FCM token:', error);
    return { success: false, error: 'Failed to save FCM token', statusCode: 500 };
  }
};

const sendLoginNotification = async (patientId) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return { success: false, error: 'Patient not found', statusCode: 404 };
    }

    await createAndEmitNotification(prisma, patientId, {
      type: 'LOGIN',
      title: 'New Login',
      message: `Your account was logged in at ${new Date().toLocaleString()}`
    });

    return { success: true, message: 'Login notification sent' };
  } catch (error) {
    console.error('Failed to send login notification:', error);
    return { success: false, error: 'Failed to send notification', statusCode: 500 };
  }
};

const logout = async (patientId) => {
  try {
    await createAuditLog({
      patientId,
      action: 'PATIENT_LOGOUT',
      description: 'Patient logged out'
    });

    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Failed to logout:', error);
    return { success: false, error: 'Failed to logout', statusCode: 500 };
  }
};

const generateJWT = (patientId, userId) => {
  return jwt.sign(
    {
      userId,
      patientId,
      role: 'PATIENT'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const verifyPassword = async (patientId, password) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      return { success: false, error: 'Patient not found', statusCode: 404 };
    }

    if (!patient.user.passwordHash) {
      return { success: false, error: 'Password not set. Please contact support.', statusCode: 400 };
    }

    const isValid = await bcrypt.compare(password, patient.user.passwordHash);

    if (!isValid) {
      await createAuditLog({
        patientId,
        action: 'REAUTH_FAILED',
        description: 'Patient failed re-authentication attempt'
      });
      return { success: false, error: 'Invalid password', statusCode: 401 };
    }

    await createAuditLog({
      patientId,
      action: 'REAUTH_SUCCESS',
      description: 'Patient re-authenticated successfully'
    });

    const newToken = generateJWT(patientId, patient.userId);

    return { success: true, valid: true, token: newToken };
  } catch (error) {
    console.error('Failed to verify password:', error);
    return { success: false, error: 'Failed to verify password', statusCode: 500 };
  }
};

const requestReauthOTP = async (patientId) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      return { success: false, error: 'Patient not found', statusCode: 404 };
    }

    if (!patient.user.phone) {
      return { success: false, error: 'Phone number not found. Please contact support.', statusCode: 400 };
    }

    const phone = patient.user.phone.replace(/\D/g, '');
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = getOTPExpiry();

    await prisma.verificationOTP.create({
      data: {
        target: phone,
        type: 'PHONE',
        otpHash,
        expiresAt,
        patientId: patient.id
      }
    });

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    await sendOTP(formattedPhone, otp);

    return {
      success: true,
      message: 'OTP sent successfully'
    };
  } catch (error) {
    console.error('Failed to request reauth OTP:', error);
    return { success: false, error: 'Failed to send OTP', statusCode: 500 };
  }
};

const verifyReauthOTP = async (patientId, otp) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      return { success: false, error: 'Patient not found', statusCode: 404 };
    }

    if (!patient.user.phone) {
      return { success: false, error: 'Phone number not found', statusCode: 400 };
    }

    const phone = patient.user.phone.replace(/\D/g, '');

    const otpRecord = await prisma.verificationOTP.findFirst({
      where: {
        target: phone,
        type: 'PHONE',
        verified: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return { success: false, error: 'OTP not found or already used', statusCode: 404 };
    }

    if (new Date() > otpRecord.expiresAt) {
      return { success: false, error: 'OTP expired', statusCode: 400 };
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return { success: false, error: 'Too many failed attempts', statusCode: 400 };
    }

    const isValid = verifyOTPUtil(otp, otpRecord.otpHash);

    if (!isValid) {
      await prisma.verificationOTP.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } }
      });
      return { success: false, error: 'Invalid OTP', statusCode: 401 };
    }

    await prisma.verificationOTP.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    await createAuditLog({
      patientId,
      action: 'REAUTH_SUCCESS',
      description: 'Patient re-authenticated successfully via OTP'
    });

    const newToken = generateJWT(patientId, patient.userId);

    return { success: true, valid: true, token: newToken };
  } catch (error) {
    console.error('Failed to verify reauth OTP:', error);
    return { success: false, error: 'Failed to verify OTP', statusCode: 500 };
  }
};

const createAuditLog = async ({ patientId, action, description, metadata }) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true }
    });

    if (!patient) return;

    await prisma.auditLog.create({
      data: {
        actorId: patient.id,
        actorRole: 'PATIENT',
        action,
        description,
        metadata: metadata || null
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

const refreshToken = async (oldToken) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        try {
          decoded = jwt.decode(oldToken);
          if (!decoded || !decoded.patientId) {
            return { success: false, error: 'Invalid token', statusCode: 401 };
          }
        } catch {
          return { success: false, error: 'Invalid token', statusCode: 401 };
        }
      } else {
        return { success: false, error: 'Invalid token', statusCode: 401 };
      }
    }

    if (!decoded || !decoded.patientId || decoded.role !== 'PATIENT') {
      return { success: false, error: 'Invalid token', statusCode: 401 };
    }

    const patient = await prisma.patient.findUnique({
      where: { id: decoded.patientId },
      include: { user: true }
    });

    if (!patient || !patient.user.isActive) {
      return { success: false, error: 'Account not found or inactive', statusCode: 401 };
    }

    const newToken = generateJWT(patient.id, patient.userId);

    return {
      success: true,
      token: newToken,
      patient: {
        id: patient.id,
        patientId: patient.patientCode,
        name: patient.name,
        photoUrl: patient.photoUrl
      }
    };
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return { success: false, error: 'Failed to refresh token', statusCode: 500 };
  }
};

module.exports = {
  login,
  verifyOTP,
  saveFcmToken,
  sendLoginNotification,
  logout,
  verifyPassword,
  requestReauthOTP,
  verifyReauthOTP,
  refreshToken,
  createAuditLog
};
