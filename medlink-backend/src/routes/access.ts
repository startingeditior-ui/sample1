import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { emitToPatient, emitToHospital } from '../services/socket';
import { createAuditLog } from '../services/auditLog';

const router = Router();
const prisma = new PrismaClient();

router.get('/active', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    
    const activeRecords = await prisma.accessRecord.findMany({
      where: {
        patientId,
        status: 'ACTIVE',
        accessExpiryTime: { gt: new Date() }
      },
      include: {
        doctor: { include: { specialization: true } },
        hospital: true
      },
      orderBy: { accessStartTime: 'desc' }
    });

    const formattedRecords = activeRecords.map(record => ({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      hospitalId: record.hospitalId,
      doctorName: record.doctor.name,
      hospitalName: record.hospital.name,
      specialization: record.doctor.specialization?.name,
      accessStartTime: record.accessStartTime.toISOString(),
      accessExpiryTime: record.accessExpiryTime.toISOString(),
      recordsViewed: JSON.parse(record.recordsViewed),
      status: record.status.toLowerCase()
    }));

    res.json({ accessRecords: formattedRecords });
  } catch (error) {
    console.error('Error fetching active records:', error);
    res.status(500).json({ error: 'Failed to fetch active records' });
  }
});

router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    
    const accessRecords = await prisma.accessRecord.findMany({
      where: { patientId },
      include: {
        doctor: { include: { specialization: true } },
        hospital: true
      },
      orderBy: { accessStartTime: 'desc' }
    });

    const formattedRecords = accessRecords.map(record => ({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      hospitalId: record.hospitalId,
      doctorName: record.doctor.name,
      hospitalName: record.hospital.name,
      specialization: record.doctor.specialization?.name,
      accessStartTime: record.accessStartTime.toISOString(),
      accessExpiryTime: record.accessExpiryTime.toISOString(),
      recordsViewed: JSON.parse(record.recordsViewed),
      status: record.status.toLowerCase()
    }));

    res.json({ accessRecords: formattedRecords });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ error: 'Failed to fetch access logs' });
  }
});

router.post('/:accessId/revoke', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { accessId } = req.params;
    const patientId = req.patientId!;

    const accessRecord = await prisma.accessRecord.findUnique({
      where: { id: accessId },
      include: { doctor: { include: { specialization: true } }, hospital: true }
    });

    if (!accessRecord) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    await prisma.accessRecord.update({
      where: { id: accessId },
      data: { status: 'REVOKED' }
    });

    const notification = await prisma.notification.create({
      data: {
        patientId,
        type: 'ACCESS_REVOKED',
        title: 'Access Revoked',
        message: `You have revoked access for ${accessRecord.doctor.name} from ${accessRecord.hospital.name}.`,
        doctorName: accessRecord.doctor.name,
        hospitalName: accessRecord.hospital.name
      }
    });

    emitToPatient(patientId, 'access:revoked', {
      accessRecord,
      notification
    });

    emitToHospital(accessRecord.hospitalId, 'access:revoked', {
      accessRecord
    });

    await createAuditLog({
      patientId,
      doctorId: accessRecord.doctorId,
      hospitalId: accessRecord.hospitalId,
      action: 'ACCESS_REVOKED',
      description: `Access revoked for doctor`
    });

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

router.post('/:accessId/extend', [
  authMiddleware,
  body('duration').isInt({ min: 1, max: 48 })
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { accessId } = req.params;
    const { duration } = req.body;
    const patientId = req.patientId!;

    const accessRecord = await prisma.accessRecord.findUnique({
      where: { id: accessId },
      include: { doctor: { include: { specialization: true } }, hospital: true }
    });

    if (!accessRecord) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    const additionalTime = duration * 60 * 60 * 1000;
    const newExpiryTime = new Date(accessRecord.accessExpiryTime.getTime() + additionalTime);

    const updatedRecord = await prisma.accessRecord.update({
      where: { id: accessId },
      data: { accessExpiryTime: newExpiryTime }
    });

    const notification = await prisma.notification.create({
      data: {
        patientId,
        type: 'ACCESS_EXTENDED',
        title: 'Access Extended',
        message: `Access for ${accessRecord.doctor.name} from ${accessRecord.hospital.name} has been extended by ${duration} hours.`,
        doctorName: accessRecord.doctor.name,
        hospitalName: accessRecord.hospital.name,
        accessTime: newExpiryTime
      }
    });

    emitToPatient(patientId, 'access:extended', {
      accessRecord: updatedRecord,
      notification
    });

    emitToHospital(accessRecord.hospitalId, 'access:extended', {
      accessRecord: updatedRecord
    });

    await createAuditLog({
      patientId,
      doctorId: accessRecord.doctorId,
      hospitalId: accessRecord.hospitalId,
      action: 'ACCESS_EXTENDED',
      description: `Access extended by ${duration} hours`,
      metadata: { additionalHours: duration }
    });

    res.json({ 
      message: 'Access extended successfully', 
      accessRecord: updatedRecord 
    });
  } catch (error) {
    console.error('Error extending access:', error);
    res.status(500).json({ error: 'Failed to extend access' });
  }
});

router.post('/block-hospital', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { hospitalId } = req.body;
    
    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }
    
    const patientId = req.patientId!;

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const existingBlock = await prisma.blockedHospital.findFirst({
      where: { patientId, hospitalId }
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'Hospital is already blocked' });
    }

    await prisma.blockedHospital.create({
      data: {
        patientId,
        hospitalId
      }
    });

    const notification = await prisma.notification.create({
      data: {
        patientId,
        type: 'HOSPITAL_BLOCKED',
        title: 'Hospital Blocked',
        message: `You have blocked ${hospital.name}. They will no longer be able to request access to your records.`,
        hospitalName: hospital.name
      }
    });

    emitToPatient(patientId, 'hospital:blocked', {
      hospital,
      notification
    });

    await createAuditLog({
      patientId,
      hospitalId,
      action: 'HOSPITAL_BLOCKED',
      description: `Hospital ${hospital.name} blocked`
    });

    res.json({ message: `Hospital ${hospital.name} blocked successfully` });
  } catch (error) {
    console.error('Error blocking hospital:', error);
    res.status(500).json({ error: 'Failed to block hospital' });
  }
});

router.delete('/block-hospital/:hospitalId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const patientId = req.patientId!;

    const blocked = await prisma.blockedHospital.findFirst({
      where: {
        patientId,
        hospitalId
      }
    });

    if (!blocked) {
      return res.status(404).json({ error: 'Hospital is not blocked' });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    await prisma.blockedHospital.delete({
      where: { id: blocked.id }
    });

    const notification = await prisma.notification.create({
      data: {
        patientId,
        type: 'HOSPITAL_UNBLOCKED',
        title: 'Hospital Unblocked',
        message: `You have unblocked ${hospital?.name}. They can now request access to your records.`,
        hospitalName: hospital?.name
      }
    });

    emitToPatient(patientId, 'hospital:unblocked', {
      hospital,
      notification
    });

    await createAuditLog({
      patientId,
      hospitalId,
      action: 'HOSPITAL_UNBLOCKED',
      description: `Hospital ${hospital?.name} unblocked`
    });

    res.json({ message: `Hospital ${hospital?.name} unblocked successfully` });
  } catch (error) {
    console.error('Error unblocking hospital:', error);
    res.status(500).json({ error: 'Failed to unblock hospital' });
  }
});

router.get('/blocked-hospitals', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;

    const blockedHospitals = await prisma.blockedHospital.findMany({
      where: { patientId },
      include: { hospital: true },
      orderBy: { blockedAt: 'desc' }
    });

    res.json({ blockedHospitals });
  } catch (error) {
    console.error('Error fetching blocked hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch blocked hospitals' });
  }
});

export default router;
