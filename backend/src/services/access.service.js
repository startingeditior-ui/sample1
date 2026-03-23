const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getActiveAccess = async (patientId) => {
  const now = new Date();
  
  const accessRecords = await prisma.accessRecord.findMany({
    where: {
      patientId,
      status: 'ACTIVE',
      accessExpiryTime: { gt: now }
    },
    include: {
      doctor: {
        select: { name: true, specialty: true }
      },
      hospital: {
        select: { name: true, id: true }
      }
    },
    orderBy: { accessStartTime: 'desc' }
  });

  const formattedRecords = accessRecords.map(record => ({
    id: record.id,
    doctorName: record.doctor?.name || 'Unknown Doctor',
    hospitalName: record.hospital?.name || 'Unknown Hospital',
    hospitalId: record.hospitalId,
    specialization: record.doctor?.specialty || 'General',
    accessStartTime: record.accessStartTime.toISOString(),
    accessExpiryTime: record.accessExpiryTime.toISOString(),
    recordsViewed: JSON.parse(record.recordsViewed || '[]')
  }));

  return {
    success: true,
    data: {
      accessRecords: formattedRecords
    }
  };
};

const getAccessLogs = async (patientId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.accessRecord.findMany({
      where: { patientId },
      include: {
        doctor: { select: { name: true } },
        hospital: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.accessRecord.count({ where: { patientId } })
  ]);

  const formattedLogs = logs.map(log => ({
    id: log.id,
    doctorName: log.doctor?.name,
    hospitalName: log.hospital?.name,
    accessStartTime: log.accessStartTime.toISOString(),
    accessExpiryTime: log.accessExpiryTime.toISOString(),
    status: log.status,
    recordsViewed: JSON.parse(log.recordsViewed || '[]')
  }));

  return {
    success: true,
    logs: formattedLogs,
    pagination: { page, limit, total }
  };
};

const revokeAccess = async (patientId, accessId) => {
  const access = await prisma.accessRecord.findUnique({
    where: { id: accessId }
  });

  if (!access) {
    return { success: false, error: 'Access record not found', statusCode: 404 };
  }

  if (access.patientId !== patientId) {
    return { success: false, error: 'Access denied', statusCode: 403 };
  }

  await prisma.accessRecord.update({
    where: { id: accessId },
    data: {
      status: 'REVOKED_BY_PATIENT',
      accessExpiryTime: new Date()
    }
  });

  await createAuditLog({
    patientId,
    action: 'ACCESS_REVOKED',
    description: 'Patient revoked doctor access',
    metadata: { accessId }
  });

  return { success: true, message: 'Access revoked successfully' };
};

const blockHospital = async (patientId, hospitalId) => {
  const existing = await prisma.blockedHospital.findUnique({
    where: {
      patientId_hospitalId: { patientId, hospitalId }
    }
  });

  if (existing) {
    return { success: true, message: 'Hospital already blocked' };
  }

  await prisma.blockedHospital.create({
    data: { patientId, hospitalId }
  });

  await createAuditLog({
    patientId,
    action: 'HOSPITAL_BLOCKED',
    description: 'Patient blocked a hospital',
    metadata: { hospitalId }
  });

  return { success: true, message: 'Hospital blocked successfully' };
};

const unblockHospital = async (patientId, hospitalId) => {
  const blocked = await prisma.blockedHospital.findUnique({
    where: {
      patientId_hospitalId: { patientId, hospitalId }
    }
  });

  if (!blocked) {
    return { success: false, error: 'Hospital not blocked', statusCode: 404 };
  }

  await prisma.blockedHospital.delete({
    where: { id: blocked.id }
  });

  await createAuditLog({
    patientId,
    action: 'HOSPITAL_UNBLOCKED',
    description: 'Patient unblocked a hospital',
    metadata: { hospitalId }
  });

  return { success: true, message: 'Hospital unblocked successfully' };
};

const getBlockedHospitals = async (patientId) => {
  const blocked = await prisma.blockedHospital.findMany({
    where: { patientId },
    include: {
      hospital: {
        select: { id: true, name: true, facilityType: true }
      }
    }
  });

  return {
    success: true,
    blockedHospitals: blocked.map(b => ({
      id: b.hospital.id,
      name: b.hospital.name,
      facilityType: b.hospital.facilityType,
      blockedAt: b.blockedAt.toISOString()
    }))
  };
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
  getActiveAccess,
  getAccessLogs,
  revokeAccess,
  blockHospital,
  unblockHospital,
  getBlockedHospitals
};
