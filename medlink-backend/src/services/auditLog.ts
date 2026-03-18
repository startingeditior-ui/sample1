import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditAction = 
  | 'CONSENT_REQUESTED'
  | 'CONSENT_APPROVED'
  | 'CONSENT_REJECTED'
  | 'ACCESS_GRANTED'
  | 'ACCESS_REVOKED'
  | 'ACCESS_EXTENDED'
  | 'PROFILE_UPDATED'
  | 'HOSPITAL_BLOCKED'
  | 'HOSPITAL_UNBLOCKED'
  | 'OTP_VERIFIED'
  | 'NOTIFICATION_SENT'
  | 'WELCOME_EMAIL_SENT'
  | 'RECORD_ADDED'
  | 'RECORD_UPDATED'
  | 'RECORD_DELETED';

export interface AuditLogData {
  patientId?: string;
  doctorId?: string;
  hospitalId?: string;
  action: AuditAction;
  description: string;
  metadata?: any;
}

export const createAuditLog = async (data: AuditLogData) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        hospitalId: data.hospitalId,
        action: data.action,
        description: data.description,
        metadata: data.metadata ?? null,   // Json field — no JSON.stringify needed
        ipAddress: null,
        userAgent: null
      }
    });
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const getAuditLogs = async (patientId?: string, limit = 50) => {
  return await prisma.auditLog.findMany({
    where: patientId ? { patientId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      patient: { select: { name: true, patientCode: true } },
      doctor: { select: { name: true } },
      hospital: { select: { name: true } }
    }
  });
};

export default prisma;
