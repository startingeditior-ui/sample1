const { PrismaClient } = require('@prisma/client');
const { generateOTP, hashOTP, getOTPExpiry, getRemainingSeconds } = require('../utils/otp.utils');
const { createAndEmitNotification } = require('../utils/socket.utils');

const prisma = new PrismaClient();

const getPendingRequests = async (patientId) => {
  const requests = await prisma.consentRequest.findMany({
    where: {
      patientId,
      status: 'PENDING'
    },
    include: {
      doctor: {
        select: { name: true, specialty: true }
      },
      hospital: {
        select: { name: true }
      }
    },
    orderBy: { requestTime: 'desc' }
  });

  const formattedRequests = requests.map(req => ({
    id: req.id,
    doctorName: req.doctor?.name || 'Unknown Doctor',
    hospitalName: req.hospital?.name || 'Unknown Hospital',
    specialization: req.doctor?.specialty || 'General',
    requestTime: req.requestTime.toISOString(),
    recordsRequested: JSON.parse(req.recordsRequested || '[]'),
    duration: req.duration
  }));

  return {
    success: true,
    data: {
      consentRequests: formattedRequests
    }
  };
};

const sendOTP = async (patientId, requestId) => {
  const request = await prisma.consentRequest.findUnique({
    where: { id: requestId }
  });

  if (!request || request.patientId !== patientId) {
    return { success: false, error: 'Consent request not found', statusCode: 404 };
  }

  if (request.status !== 'PENDING') {
    return { success: false, error: 'Request already processed', statusCode: 400 };
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = getOTPExpiry();

  await prisma.consentRequest.update({
    where: { id: requestId },
    data: {
      otp: otpHash,
      otpExpiresAt: expiresAt
    }
  });

  // OTP generated and stored (will be sent via SMS)

  return {
    success: true,
    message: 'OTP sent to your registered number',
    expiresInSeconds: getRemainingSeconds(expiresAt)
  };
};

const approveConsent = async (patientId, requestId, otp, duration = 24) => {
  const request = await prisma.consentRequest.findUnique({
    where: { id: requestId }
  });

  if (!request || request.patientId !== patientId) {
    return { success: false, error: 'Consent request not found', statusCode: 404 };
  }

  if (request.status !== 'PENDING') {
    return { success: false, error: 'Request already processed', statusCode: 400 };
  }

  if (request.otp && request.otpExpiresAt) {
    const inputHash = hashOTP(otp);
    if (inputHash !== request.otp) {
      return { success: false, error: 'Invalid OTP', statusCode: 401 };
    }

    if (new Date() > request.otpExpiresAt) {
      return { success: false, error: 'OTP expired', statusCode: 400 };
    }
  }

  const now = new Date();
  const expiryTime = new Date(now.getTime() + duration * 60 * 60 * 1000);

  await prisma.consentRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      responseTime: now,
      duration,
      otp: null,
      otpExpiresAt: null
    }
  });

  const existingAccess = await prisma.accessRecord.findFirst({
    where: {
      patientId,
      doctorId: request.doctorId,
      status: 'ACTIVE',
      accessExpiryTime: { gt: now }
    }
  });

  if (existingAccess) {
    await prisma.accessRecord.update({
      where: { id: existingAccess.id },
      data: { accessExpiryTime: expiryTime }
    });
  } else {
    await prisma.accessRecord.create({
      data: {
        patientId,
        doctorId: request.doctorId,
        hospitalId: request.hospitalId,
        accessExpiryTime: expiryTime,
        status: 'ACTIVE',
        recordsViewed: request.recordsRequested
      }
    });
  }

  await createAndEmitNotification(prisma, patientId, {
    type: 'CONSENT_APPROVED',
    title: 'Access Granted',
    message: `You granted access to ${request.hospitalId}`,
    doctorName: request.doctorId,
    hospitalName: request.hospitalId,
    accessTime: now
  });

  await createAuditLog({
    patientId,
    action: 'CONSENT_APPROVED',
    description: 'Patient approved consent request',
    metadata: { requestId, duration }
  });

  return {
    success: true,
    message: 'Consent approved successfully',
    accessExpiresAt: expiryTime.toISOString()
  };
};

const rejectConsent = async (patientId, requestId) => {
  const request = await prisma.consentRequest.findUnique({
    where: { id: requestId }
  });

  if (!request || request.patientId !== patientId) {
    return { success: false, error: 'Consent request not found', statusCode: 404 };
  }

  if (request.status !== 'PENDING') {
    return { success: false, error: 'Request already processed', statusCode: 400 };
  }

  await prisma.consentRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      responseTime: new Date()
    }
  });

  await createAndEmitNotification(prisma, patientId, {
    type: 'CONSENT_REJECTED',
    title: 'Access Denied',
    message: `You denied access request from ${request.hospitalId}`
  });

  await createAuditLog({
    patientId,
    action: 'CONSENT_REJECTED',
    description: 'Patient rejected consent request',
    metadata: { requestId }
  });

  return { success: true, message: 'Consent rejected successfully' };
};

const requestAccess = async (patientId, targetPatientId) => {
  return { success: false, error: 'Not implemented', statusCode: 501 };
};

const createAuditLog = async ({ patientId, action, description, metadata }) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { userId: true }
    });
    if (!patient) return;

    await prisma.auditLog.create({
      data: {
        actorId: patient.userId,
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

module.exports = {
  getPendingRequests,
  sendOTP,
  approveConsent,
  rejectConsent,
  requestAccess
};
