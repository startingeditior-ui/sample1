const { PrismaClient } = require('@prisma/client');
const { generateOTP, hashOTP, verifyOTP, getOTPExpiry, getRemainingSeconds } = require('../utils/otp.utils');
const { createAndEmitNotification } = require('../utils/socket.utils');

const prisma = new PrismaClient();

const getPatientProfile = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      patientCode: true,
      name: true,
      gender: true,
      dob: true,
      bloodGroup: true,
      photoUrl: true,
      address: true,
      phone: true,
      emergencyContact: true,
      emergencyContactName: true,
      emergencyContactRelationship: true,
      medications: true,
      surgeries: true,
      allergies: true,
      chronicDiseases: true,
      guardianName: true,
      guardianMobile: true,
      guardianLocation: true,
      insuranceProvider: true,
      insuranceCustomerId: true,
      insuranceType: true,
      insuranceSupportNumber: true,
      insuranceExpiryDate: true,
      insuranceSumInsured: true,
      createdAt: true,
      user: {
        select: {
          phone: true,
          email: true
        }
      }
    }
  });

  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  const apiBase = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5002}`).replace(/\/$/, '');
  const rawPhoto = patient.photoUrl || null;
  const resolvedPhotoUrl = rawPhoto
    ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:')
        ? rawPhoto
        : `${apiBase}${rawPhoto}`)
    : null;

  return {
    success: true,
    data: {
      patient: {
        id: patientId,
        patientId: patient.patientCode,
        patientCode: patient.patientCode,
        name: patient.name,
        phone: patient.phone || patient.user?.phone,
        email: patient.user?.email,
        gender: patient.gender,
        dob: patient.dob ? patient.dob.toISOString().split('T')[0] : null,
        dateOfBirth: patient.dob ? patient.dob.toISOString().split('T')[0] : null,
        bloodGroup: patient.bloodGroup,
        photoUrl: resolvedPhotoUrl,
        profilePhoto: resolvedPhotoUrl,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactRelationship: patient.emergencyContactRelationship,
        currentMedications: patient.medications?.join(', ') || '',
        pastSurgeries: patient.surgeries?.join(', ') || '',
        allergies: patient.allergies || [],
        chronicDiseases: patient.chronicDiseases || [],
        guardianName: patient.guardianName,
        guardianMobile: patient.guardianMobile,
        guardianLocation: patient.guardianLocation,
        insuranceProvider: patient.insuranceProvider,
        insuranceCustomerId: patient.insuranceCustomerId,
        insuranceType: patient.insuranceType,
        insuranceSupportNumber: patient.insuranceSupportNumber,
        insuranceExpiryDate: patient.insuranceExpiryDate ? patient.insuranceExpiryDate.toISOString().split('T')[0] : null,
        insuranceSumInsured: patient.insuranceSumInsured,
        createdAt: patient.createdAt.toISOString()
      }
    }
  };
};

const updatePatientProfile = async (patientId, data) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  
  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.address) updateData.address = data.address;
  if (data.emergencyContact) updateData.emergencyContact = data.emergencyContact;
  if (data.medications) updateData.medications = data.medications.split(',').map(m => m.trim()).filter(Boolean);
  if (data.surgeries) updateData.surgeries = data.surgeries.split(',').map(s => s.trim()).filter(Boolean);
  if (data.photoUrl) updateData.photoUrl = data.photoUrl;
  if (data.insuranceProvider) updateData.insuranceProvider = data.insuranceProvider;
  if (data.insuranceCustomerId) updateData.insuranceCustomerId = data.insuranceCustomerId;
  if (data.insuranceType) updateData.insuranceType = data.insuranceType;
  if (data.insuranceSupportNumber) updateData.insuranceSupportNumber = data.insuranceSupportNumber;
  if (data.insuranceExpiryDate) updateData.insuranceExpiryDate = new Date(data.insuranceExpiryDate);
  if (data.insuranceSumInsured) updateData.insuranceSumInsured = data.insuranceSumInsured;

  await prisma.patient.update({
    where: { id: patientId },
    data: updateData
  });

  await createAuditLog({
    patientId,
    action: 'PROFILE_UPDATED',
    description: 'Patient updated their profile'
  });

  await createAndEmitNotification(prisma, patientId, {
    type: 'PROFILE_UPDATED',
    title: 'Profile Updated',
    message: 'Your profile information has been updated'
  });

  return { success: true, message: 'Profile updated successfully' };
};

const getEmergencyData = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      name: true,
      gender: true,
      dob: true,
      bloodGroup: true,
      allergies: true,
      chronicDiseases: true,
      emergencyContact: true,
      emergencyContactName: true,
      emergencyContactRelationship: true,
      medications: true,
      phone: true,
      guardianName: true,
      guardianMobile: true
    }
  });

  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  return {
    success: true,
    data: {
      name: patient.name,
      gender: patient.gender,
      dob: patient.dob ? patient.dob.toISOString().split('T')[0] : null,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies || [],
      chronicDiseases: patient.chronicDiseases || [],
      emergencyContact: patient.emergencyContact,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactRelationship: patient.emergencyContactRelationship,
      medications: patient.medications || [],
      phone: patient.phone,
      guardianName: patient.guardianName,
      guardianMobile: patient.guardianMobile
    }
  };
};

const getRecordTypes = async (patientId) => {
  const types = await prisma.medicalRecordType.findMany({
    orderBy: { name: 'asc' }
  });

  return {
    success: true,
    data: types.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon
    }))
  };
};

const addPatientRecord = async (patientId, data) => {
  const record = await prisma.patientRecord.create({
    data: {
      patientId,
      recordTypeId: data.recordTypeId,
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      date: new Date(data.date),
      hospitalId: data.hospitalId || null,
      doctorId: data.doctorId || null
    }
  });

  await createAuditLog({
    patientId,
    action: 'RECORD_ADDED',
    description: `Added new record: ${data.title}`,
    metadata: { recordId: record.id }
  });

  await createAndEmitNotification(prisma, patientId, {
    type: 'RECORD_ADDED',
    title: 'New Medical Record',
    message: `A new record "${data.title}" has been added to your profile`
  });

  return { success: true, recordId: record.id, message: 'Record added successfully' };
};

const updatePatientRecord = async (patientId, recordId, data) => {
  const record = await prisma.patientRecord.findUnique({
    where: { id: recordId }
  });

  if (!record) {
    return { success: false, error: 'Record not found', statusCode: 404 };
  }

  if (record.patientId !== patientId) {
    return { success: false, error: 'Access denied', statusCode: 403 };
  }

  const updateData = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.fileUrl) updateData.fileUrl = data.fileUrl;
  if (data.date) updateData.date = new Date(data.date);

  await prisma.patientRecord.update({
    where: { id: recordId },
    data: updateData
  });

  await createAuditLog({
    patientId,
    action: 'RECORD_UPDATED',
    description: `Updated record: ${data.title || record.title}`,
    metadata: { recordId }
  });

  return { success: true, message: 'Record updated successfully' };
};

const deletePatientRecord = async (patientId, recordId) => {
  const record = await prisma.patientRecord.findUnique({
    where: { id: recordId }
  });

  if (!record) {
    return { success: false, error: 'Record not found', statusCode: 404 };
  }

  if (record.patientId !== patientId) {
    return { success: false, error: 'Access denied', statusCode: 403 };
  }

  await prisma.patientRecord.delete({
    where: { id: recordId }
  });

  await createAuditLog({
    patientId,
    action: 'RECORD_DELETED',
    description: 'Deleted a medical record',
    metadata: { recordId }
  });

  return { success: true, message: 'Record deleted successfully' };
};

const getMedicalRecords = async (patientId, search = null, recordTypeId = null) => {
  const where = { patientId };
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (recordTypeId) {
    where.recordTypeId = recordTypeId;
  }

  const records = await prisma.patientRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      recordType: {
        select: { name: true }
      },
      doctor: {
        select: { name: true, specialty: true }
      },
      hospital: {
        select: { name: true }
      }
    }
  });

  const formattedRecords = records.map(record => ({
    id: record.id,
    recordType: { name: record.recordType?.name || 'GENERAL' },
    type: record.recordType?.name || 'GENERAL',
    title: record.title,
    description: record.description,
    date: record.recordDate?.toISOString() || record.createdAt.toISOString(),
    fileUrl: record.fileUrl ? `/uploads/records/${record.fileUrl}` : null,
    uploadedBy: record.doctor?.name || record.hospital?.name || 'Unknown',
    uploadedAt: record.createdAt.toISOString(),
    doctorName: record.doctor?.name || null,
    doctorSpecialization: record.doctor?.specialty || null,
    hospitalId: record.hospital?.id || null,
    hospitalName: record.hospital?.name || 'Unknown Hospital',
    notes: record.description
  }));

  return { success: true, data: formattedRecords };
};

const getMedicalRecordById = async (patientId, recordId) => {
  const record = await prisma.patientRecord.findUnique({
    where: { id: recordId },
    include: {
      recordType: {
        select: { name: true }
      },
      doctor: {
        select: { name: true }
      },
      hospital: {
        select: { name: true }
      }
    }
  });

  if (!record) {
    return { success: false, error: 'Record not found', statusCode: 404 };
  }

  if (record.patientId !== patientId) {
    return { success: false, error: 'Access denied', statusCode: 403 };
  }

  const apiBase = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5002}`).replace(/\/$/, '');
  const resolvedFileUrl = record.fileUrl
    ? (record.fileUrl.startsWith('http') ? record.fileUrl : `${apiBase}/uploads/records/${record.fileUrl}`)
    : null;

  return {
    success: true,
    data: {
      id: record.id,
      type: record.recordType?.name || 'GENERAL',
      title: record.title,
      description: record.description,
      fileUrl: resolvedFileUrl,
      date: record.date.toISOString(),
      uploadedBy: record.doctor?.name || record.hospital?.name || 'Unknown',
      uploadedAt: record.createdAt.toISOString()
    }
  };
};

const generateShareOTP = async (patientId) => {
  const existingSession = await prisma.oTPSession.findFirst({
    where: {
      patientId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    }
  });

  if (existingSession) {
    return {
      success: true,
      otp: null,
      expiresAt: existingSession.expiresAt.toISOString(),
      expiresInSeconds: getRemainingSeconds(existingSession.expiresAt),
      existing: true
    };
  }

  const pendingSession = await prisma.oTPSession.findFirst({
    where: {
      patientId,
      status: 'PENDING',
      expiresAt: { gt: new Date() }
    }
  });

  if (pendingSession) {
    return {
      success: true,
      otp: null,
      expiresAt: pendingSession.expiresAt.toISOString(),
      expiresInSeconds: getRemainingSeconds(pendingSession.expiresAt),
      existing: true
    };
  }

  const plainOTP = generateOTP();
  const hashedOTP = hashOTP(plainOTP);
  const expiresAt = getOTPExpiry();

  await prisma.oTPSession.create({
    data: {
      patientId,
      otpHash: hashedOTP,
      status: 'PENDING',
      expiresAt
    }
  });

  await createAuditLog({
    patientId,
    action: 'OTP_GENERATED',
    description: 'Patient generated OTP for record sharing'
  });

  return {
    success: true,
    otp: plainOTP,
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: Math.floor(10 * 60),
    existing: false
  };
};

const getOTPStatus = async (patientId) => {
  const activeSession = await prisma.oTPSession.findFirst({
    where: {
      patientId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    },
    include: {
      patient: false
    }
  });

  if (!activeSession) {
    return {
      success: true,
      hasActiveSession: false,
      session: null
    };
  }

  return {
    success: true,
    hasActiveSession: true,
    session: {
      doctorName: activeSession.doctorName || 'Doctor',
      hospitalName: activeSession.hospitalName || 'Hospital',
      startedAt: activeSession.verifiedAt?.toISOString() || activeSession.createdAt.toISOString(),
      expiresAt: activeSession.expiresAt.toISOString()
    }
  };
};

const revokeOTPSession = async (patientId) => {
  const activeSession = await prisma.oTPSession.findFirst({
    where: {
      patientId,
      status: 'ACTIVE'
    }
  });

  if (!activeSession) {
    return { success: false, error: 'No active session found', statusCode: 404 };
  }

  await prisma.oTPSession.update({
    where: { id: activeSession.id },
    data: {
      status: 'REVOKED_BY_PATIENT',
      endedAt: new Date()
    }
  });

  await createAuditLog({
    patientId,
    action: 'SESSION_REVOKED_BY_PATIENT',
    description: 'Patient revoked doctor access',
    metadata: { sessionId: activeSession.id }
  });

  return { success: true, message: 'Access revoked' };
};

const getAuditLog = async (patientId, page = 1, limit = 20) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { userId: true }
  });

  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { actorId: patient.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({
      where: { actorId: patient.userId }
    })
  ]);

  const formattedLogs = logs.map(log => ({
    id: log.id,
    action: log.action,
    performedBy: log.description?.split(' ')[0] || 'System',
    performedByRole: log.actorRole,
    timestamp: log.createdAt.toISOString(),
    details: log.description
  }));

  return {
    success: true,
    data: formattedLogs,
    pagination: {
      page,
      limit,
      total
    }
  };
};

const getQRData = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { patientCode: true }
  });

  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  return {
    success: true,
    qrData: `MEDLINK:${patient.patientCode}`,
    patientCode: patient.patientCode
  };
};

const getPatientInsurance = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      insuranceProvider: true,
      insuranceCustomerId: true,
      insuranceType: true,
      insuranceSupportNumber: true,
      insuranceExpiryDate: true,
      insuranceSumInsured: true
    }
  });

  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  return {
    success: true,
    data: {
      insuranceProvider: patient.insuranceProvider,
      insuranceCustomerId: patient.insuranceCustomerId,
      insuranceType: patient.insuranceType,
      insuranceSupportNumber: patient.insuranceSupportNumber,
      insuranceExpiryDate: patient.insuranceExpiryDate ? patient.insuranceExpiryDate.toISOString().split('T')[0] : null,
      insuranceSumInsured: patient.insuranceSumInsured
    }
  };
};

const updatePatientInsurance = async (patientId, data) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  
  if (!patient) {
    return { success: false, error: 'Patient not found', statusCode: 404 };
  }

  const updateData = {};
  if (data.insuranceProvider !== undefined) updateData.insuranceProvider = data.insuranceProvider || null;
  if (data.insuranceCustomerId !== undefined) updateData.insuranceCustomerId = data.insuranceCustomerId || null;
  if (data.insuranceType !== undefined) updateData.insuranceType = data.insuranceType || null;
  if (data.insuranceSupportNumber !== undefined) updateData.insuranceSupportNumber = data.insuranceSupportNumber || null;
  if (data.insuranceExpiryDate !== undefined) updateData.insuranceExpiryDate = data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : null;
  if (data.insuranceSumInsured !== undefined) updateData.insuranceSumInsured = data.insuranceSumInsured || null;

  await prisma.patient.update({
    where: { id: patientId },
    data: updateData
  });

  await createAuditLog({
    patientId,
    action: 'INSURANCE_UPDATED',
    description: 'Patient updated their insurance policy'
  });

  return { success: true, message: 'Insurance updated successfully' };
};

const createAuditLog = async ({ patientId, action, description, metadata }) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: patientId,
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

const setPassword = async (patientId, newPassword) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      return { success: false, error: 'Patient not found', statusCode: 404 };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters', statusCode: 400 };
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return { success: false, error: 'Password must contain uppercase, lowercase, and number', statusCode: 400 };
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: patient.userId },
      data: { passwordHash }
    });

    await createAuditLog({
      patientId,
      action: 'PASSWORD_SET',
      description: 'Patient set their password'
    });

    return { success: true, message: 'Password set successfully' };
  } catch (error) {
    console.error('Failed to set password:', error);
    return { success: false, error: 'Failed to set password', statusCode: 500 };
  }
};

module.exports = {
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
  setPassword
};
